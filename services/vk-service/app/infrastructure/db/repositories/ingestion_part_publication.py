from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_part_publication import (
    IngestionPartPublicationClaim,
)
from app.infrastructure.db.repositories.ingestion_part_claims import claim_pending
from app.infrastructure.db.repositories.ingestion_part_publication_failure import (
    release_for_retry,
)
from app.infrastructure.db.repositories.ingestion_part_publication_success import (
    mark_published,
)
from app.infrastructure.db.repositories.ingestion_part_publication_terminal import (
    mark_failed,
    quarantine,
)
from app.infrastructure.db.repositories.ingestion_part_publication_validation import (
    normalized_reason,
    require_aware,
    require_future,
    require_sha256,
)
from app.infrastructure.db.repositories.ingestion_part_reference_recovery import (
    recover_missing_references,
)


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
        return await claim_pending(
            self.session,
            worker_id=worker_id,
            limit=limit,
            lease_expires_at=lease_expires_at,
        )

    async def mark_published(
        self,
        *,
        claim_id: UUID,
        part_id: UUID,
        wire_digest: str,
        published_at: datetime,
    ) -> None:
        require_aware(published_at, "published_at")
        require_sha256(wire_digest)
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
        require_future(next_attempt_at, "next_attempt_at")
        await release_for_retry(
            self.session,
            claim_id=claim_id,
            part_id=part_id,
            error=normalized_reason(error),
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
        require_aware(failed_at, "failed_at")
        await mark_failed(
            self.session,
            claim_id=claim_id,
            part_id=part_id,
            error=normalized_reason(error),
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
        require_aware(quarantined_at, "quarantined_at")
        await quarantine(
            self.session,
            claim_id=claim_id,
            part_id=part_id,
            reason=normalized_reason(reason),
            quarantined_at=quarantined_at,
        )

    async def recover_missing_references(self, *, limit: int) -> int:
        return await recover_missing_references(self.session, limit=limit)
