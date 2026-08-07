from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import or_, select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_part_publication import (
    IngestionPartPublicationClaim,
)
from app.domain.entities.ingestion_parts import PREPARED
from app.domain.entities.ingestion_staging import PREPARED as BATCH_PREPARED
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.infrastructure.db.repositories.ingestion_part_publication_records import (
    claim_from_models,
)
from app.infrastructure.db.repositories.ingestion_part_publication_transitions import (
    mark_published,
    quarantine,
    release_for_retry,
)


def utcnow() -> datetime:
    return datetime.now(UTC)


class SqlAlchemyIngestionPartPublicationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def claim_pending(
        self,
        *,
        worker_id: str,
        limit: int,
        lease_expires_at: datetime,
    ) -> tuple[IngestionPartPublicationClaim, ...]:
        now = utcnow()
        if not worker_id or len(worker_id) > 128:
            raise ValueError("worker_id must contain 1..128 characters")
        if not 1 <= limit <= 1000:
            raise ValueError("claim limit must be between 1 and 1000")
        if lease_expires_at.tzinfo is None or lease_expires_at <= now:
            raise ValueError("claim lease must expire in the future")

        statement = (
            select(
                VkIngestionPartReference,
                VkIngestionStagingPart,
                VkIngestionStagingBatch,
            )
            .join(
                VkIngestionStagingPart,
                VkIngestionStagingPart.id == VkIngestionPartReference.part_id,
            )
            .join(
                VkIngestionStagingBatch,
                VkIngestionStagingBatch.id == VkIngestionStagingPart.batch_id,
            )
            .where(
                VkIngestionPartReference.status == "pending",
                VkIngestionPartReference.next_attempt_at <= now,
                or_(
                    VkIngestionPartReference.claim_id.is_(None),
                    VkIngestionPartReference.claim_expires_at <= now,
                ),
                VkIngestionStagingPart.status == PREPARED,
                VkIngestionStagingBatch.status == BATCH_PREPARED,
            )
            .order_by(
                VkIngestionPartReference.next_attempt_at,
                VkIngestionPartReference.created_at,
                VkIngestionStagingPart.part_index,
            )
            .limit(limit)
        )
        if self.session.get_bind().dialect.name == "postgresql":
            statement = statement.with_for_update(
                of=VkIngestionPartReference,
                skip_locked=True,
            )
        rows = (await self.session.execute(statement)).all()
        for reference, _part, _batch in rows:
            reference.claim_id = uuid4()
            reference.claimed_by = worker_id
            reference.claim_expires_at = lease_expires_at
            reference.attempts += 1
            reference.updated_at = now
        await self.session.flush()
        return tuple(claim_from_models(*row) for row in rows)

    async def mark_published(
        self,
        *,
        claim_id: UUID,
        part_id: UUID,
        wire_digest: str,
        published_at: datetime,
    ) -> None:
        _aware(published_at, "published_at")
        if len(wire_digest) != 64:
            raise ValueError("wire_digest must be a SHA-256 hex digest")
        await mark_published(
            self.session,
            claim_id=claim_id,
            part_id=part_id,
            wire_digest=wire_digest,
            published_at=published_at,
        )

    async def release_for_retry(
        self,
        *,
        claim_id: UUID,
        part_id: UUID,
        error: str,
        next_attempt_at: datetime,
    ) -> None:
        _aware(next_attempt_at, "next_attempt_at")
        await release_for_retry(
            self.session,
            claim_id=claim_id,
            part_id=part_id,
            error=_reason(error),
            next_attempt_at=next_attempt_at,
        )

    async def quarantine(
        self,
        *,
        claim_id: UUID,
        part_id: UUID,
        reason: str,
        quarantined_at: datetime,
    ) -> None:
        _aware(quarantined_at, "quarantined_at")
        await quarantine(
            self.session,
            claim_id=claim_id,
            part_id=part_id,
            reason=_reason(reason),
            quarantined_at=quarantined_at,
        )

    async def recover_missing_references(self, *, limit: int) -> int:
        if not 1 <= limit <= 1000:
            raise ValueError("recovery limit must be between 1 and 1000")
        statement = (
            select(VkIngestionStagingPart.id)
            .join(
                VkIngestionStagingBatch,
                VkIngestionStagingBatch.id == VkIngestionStagingPart.batch_id,
            )
            .outerjoin(
                VkIngestionPartReference,
                VkIngestionPartReference.part_id == VkIngestionStagingPart.id,
            )
            .where(
                VkIngestionStagingPart.status == PREPARED,
                VkIngestionStagingBatch.status == BATCH_PREPARED,
                VkIngestionPartReference.part_id.is_(None),
            )
            .order_by(VkIngestionStagingPart.prepared_at)
            .limit(limit)
        )
        if self.session.get_bind().dialect.name == "postgresql":
            statement = statement.with_for_update(
                of=VkIngestionStagingPart,
                skip_locked=True,
            )
        part_ids = (await self.session.scalars(statement)).all()
        inserted = 0
        for part_id in part_ids:
            result = await self.session.execute(self._reference_insert(part_id))
            inserted += int(result.rowcount == 1)
        await self.session.flush()
        return inserted

    def _reference_insert(self, part_id: UUID):
        dialect = self.session.get_bind().dialect.name
        values = {"part_id": part_id, "status": "pending"}
        if dialect == "postgresql":
            statement = postgresql_insert(VkIngestionPartReference).values(**values)
        elif dialect == "sqlite":
            statement = sqlite_insert(VkIngestionPartReference).values(**values)
        else:
            raise RuntimeError(f"unsupported publication dialect: {dialect}")
        return statement.on_conflict_do_nothing()


def _aware(value: datetime, label: str) -> None:
    if value.tzinfo is None:
        raise ValueError(f"{label} must be timezone-aware")


def _reason(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError("publication failure reason must not be empty")
    return normalized[:2000]
