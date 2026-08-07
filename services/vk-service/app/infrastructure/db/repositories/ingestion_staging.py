from __future__ import annotations

from datetime import UTC
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.domain.repositories.ingestion_staging import (
    StagingPayloadConflictError,
    StagingPayloadIntegrityError,
)
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch


class SqlAlchemyIngestionStagingRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def stage(
        self, batch: StagedIngestionBatch
    ) -> tuple[StagedIngestionBatch, bool]:
        expected = self._verified(batch)
        values = {
            "id": expected.batch_id,
            "execution_id": expected.execution_id,
            "staged_by_attempt_id": expected.staged_by_attempt_id,
            "staged_by_fencing_token": expected.staged_by_fencing_token,
            "source_kind": expected.source_kind,
            "owner_id": expected.owner_id,
            "post_id": expected.post_id,
            "page_offset": expected.page_offset,
            "payload_digest": expected.payload_digest,
            "payload_bytes": expected.payload_bytes,
            "payload": expected.payload,
            "status": expected.status,
            "created_at": expected.staged_at,
            "updated_at": expected.staged_at,
        }
        dialect = self.session.get_bind().dialect.name
        if dialect == "postgresql":
            statement = postgresql_insert(VkIngestionStagingBatch).values(**values)
            statement = statement.on_conflict_do_nothing()
        elif dialect == "sqlite":
            statement = sqlite_insert(VkIngestionStagingBatch).values(**values)
            statement = statement.on_conflict_do_nothing()
        else:
            raise RuntimeError(f"unsupported staging dialect: {dialect}")

        result = await self.session.execute(statement)
        existing = await self._get_by_position(expected)
        if existing is None:
            raise RuntimeError("staging insert conflict did not resolve to a durable row")
        existing_batch = self._to_domain(existing)
        self._verify(existing_batch, expected)
        return existing_batch, result.rowcount == 1

    async def get(self, batch_id: UUID) -> StagedIngestionBatch | None:
        model = await self.session.get(VkIngestionStagingBatch, batch_id)
        return self._to_domain(model) if model is not None else None

    async def _get_by_position(
        self, batch: StagedIngestionBatch
    ) -> VkIngestionStagingBatch | None:
        return await self.session.scalar(
            select(VkIngestionStagingBatch).where(
                VkIngestionStagingBatch.execution_id == batch.execution_id,
                VkIngestionStagingBatch.source_kind == batch.source_kind,
                VkIngestionStagingBatch.owner_id == batch.owner_id,
                VkIngestionStagingBatch.post_id == batch.post_id,
                VkIngestionStagingBatch.page_offset == batch.page_offset,
            )
        )

    @staticmethod
    def _verified(batch: StagedIngestionBatch) -> StagedIngestionBatch:
        try:
            return batch.verified_copy()
        except ValueError as error:
            raise StagingPayloadIntegrityError(str(error)) from error

    @staticmethod
    def _verify(
        existing: StagedIngestionBatch, expected: StagedIngestionBatch
    ) -> None:
        if existing.batch_id != expected.batch_id:
            raise StagingPayloadConflictError(
                "staging position resolved to a non-deterministic batch id"
            )
        if (
            existing.payload_digest != expected.payload_digest
            or existing.payload_bytes != expected.payload_bytes
            or existing.payload != expected.payload
        ):
            raise StagingPayloadConflictError(
                "staging position already contains a different provider payload"
            )

    @classmethod
    def _to_domain(cls, model: VkIngestionStagingBatch) -> StagedIngestionBatch:
        staged_at = model.created_at
        if staged_at.tzinfo is None:
            staged_at = staged_at.replace(tzinfo=UTC)
        return cls._verified(
            StagedIngestionBatch(
                batch_id=model.id,
                execution_id=model.execution_id,
                staged_by_attempt_id=model.staged_by_attempt_id,
                staged_by_fencing_token=model.staged_by_fencing_token,
                source_kind=model.source_kind,
                owner_id=model.owner_id,
                post_id=model.post_id,
                page_offset=model.page_offset,
                payload=dict(model.payload),
                payload_digest=model.payload_digest,
                payload_bytes=model.payload_bytes,
                staged_at=staged_at,
                status=model.status,
            )
        )
