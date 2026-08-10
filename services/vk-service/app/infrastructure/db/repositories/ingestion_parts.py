from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_parts import (
    REFERENCE_STATUSES,
    IngestionPart,
    IngestionPartReference,
)
from app.domain.entities.ingestion_staging import PREPARED, STAGED
from app.domain.repositories.ingestion_parts import IngestionPartConflictError
from app.infrastructure.db.models.ingestion_parts import (
    VkIngestionPartReference,
    VkIngestionStagingPart,
)
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.ingestion_part_records import (
    part_from_model,
    part_values,
)
from app.infrastructure.db.repositories.ingestion_part_set_validation import (
    validate_part_set,
    verify_part_set,
)


class SqlAlchemyIngestionPartRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def prepare(
        self,
        parts: tuple[IngestionPart, ...],
        references: tuple[IngestionPartReference, ...],
    ) -> tuple[tuple[IngestionPart, ...], bool]:
        validate_part_set(parts, references)
        batch = await self._lock_batch(parts[0].batch_id)
        existing = await self.list_for_batch(parts[0].batch_id)
        if existing:
            verify_part_set(existing, parts)
            await self._verify_references(references)
            self._mark_batch_prepared(batch)
            return existing, False

        dialect = self.session.get_bind().dialect.name
        inserted = 0
        for part in parts:
            result = await self.session.execute(
                self._insert(dialect, VkIngestionStagingPart, part_values(part))
            )
            inserted += int(result.rowcount == 1)
        for reference in references:
            await self.session.execute(
                self._insert(
                    dialect,
                    VkIngestionPartReference,
                    {"part_id": reference.part_id, "status": reference.status},
                )
            )

        stored = await self.list_for_batch(parts[0].batch_id)
        verify_part_set(stored, parts)
        await self._verify_references(references)
        if inserted not in {0, len(parts)}:
            raise IngestionPartConflictError(
                "concurrent preparation produced a partial ingestion part set"
            )
        self._mark_batch_prepared(batch)
        return stored, inserted == len(parts)

    async def list_for_batch(self, batch_id: UUID) -> tuple[IngestionPart, ...]:
        models = (
            await self.session.scalars(
                select(VkIngestionStagingPart)
                .where(VkIngestionStagingPart.batch_id == batch_id)
                .order_by(VkIngestionStagingPart.part_index)
            )
        ).all()
        return tuple(part_from_model(model) for model in models)

    async def _lock_batch(self, batch_id: UUID) -> VkIngestionStagingBatch:
        batch = await self.session.scalar(
            select(VkIngestionStagingBatch)
            .where(VkIngestionStagingBatch.id == batch_id)
            .with_for_update()
        )
        if batch is None:
            raise IngestionPartConflictError(
                "ingestion part preparation requires a durable staged batch"
            )
        return batch

    @staticmethod
    def _mark_batch_prepared(batch: VkIngestionStagingBatch) -> None:
        if batch.status not in {STAGED, PREPARED}:
            raise IngestionPartConflictError(
                "terminal staged batch cannot be prepared again"
            )
        batch.status = PREPARED

    async def _verify_references(
        self,
        expected: tuple[IngestionPartReference, ...],
    ) -> None:
        expected_ids = {reference.part_id for reference in expected}
        models = (
            await self.session.scalars(
                select(VkIngestionPartReference).where(
                    VkIngestionPartReference.part_id.in_(expected_ids)
                )
            )
        ).all()
        actual_ids = {model.part_id for model in models}
        if actual_ids != expected_ids or any(
            model.status not in REFERENCE_STATUSES for model in models
        ):
            raise IngestionPartConflictError(
                "ingestion part references are missing or incompatible"
            )

    @staticmethod
    def _insert(dialect: str, model, values: dict):
        if dialect == "postgresql":
            statement = postgresql_insert(model).values(**values)
        elif dialect == "sqlite":
            statement = sqlite_insert(model).values(**values)
        else:
            raise RuntimeError(f"unsupported ingestion part dialect: {dialect}")
        return statement.on_conflict_do_nothing()
