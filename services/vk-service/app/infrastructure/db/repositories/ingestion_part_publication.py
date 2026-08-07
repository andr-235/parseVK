from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import or_, select
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
from app.infrastructure.db.repositories.ingestion_part_publication_failure import (
    release_for_retry,
)
from app.infrastructure.db.repositories.ingestion_part_publication_records import (
    claim_from_models,
)
from app.infrastructure.db.repositories.ingestion_part_publication_success import (
    mark_published,
)
from app.infrastructure.db.repositories.ingestion_part_publication_terminal import (
    mark_failed,
    quarantine,
)
from app.infrastructure.db.repositories.ingestion_part_reference_recovery import (
    recover_missing_references,
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
        _sha256(wire_digest)
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
        if next_attempt_at <= utcnow():
            raise ValueError("next_attempt_at must be in the future")
        await release_for_retry(
            self.session,
            claim_id=claim_id,
            part_id=part_id,
            error=_reason(error),
            next_attempt_at=next_attempt_at,
        )

    async def mark_failed(
        self,
        *,
        claim_id: UUID,
        part_id: UUID,
        error: str,
        failed_at: datetime,
    ) -> None:
        _aware(failed_at, "failed_at")
        await mark_failed(
            self.session,
            claim_id=claim_id,
            part_id=part_id,
            error=_reason(error),
            failed_at=failed_at,
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
        return await recover_missing_references(self.session, limit=limit)


def _aware(value: datetime, label: str) -> None:
    if value.tzinfo is None:
        raise ValueError(f"{label} must be timezone-aware")


def _reason(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError("publication failure reason must not be empty")
    return normalized[:2000]


def _sha256(value: str) -> None:
    if len(value) != 64:
        raise ValueError("wire_digest must be a SHA-256 hex digest")
    try:
        int(value, 16)
    except ValueError as error:
        raise ValueError("wire_digest must be a SHA-256 hex digest") from error
