from datetime import datetime
from typing import Protocol
from uuid import UUID

from app.domain.entities.ingestion_part_publication import (
    IngestionPartPublicationClaim,
)


class IngestionPartPublicationConflictError(RuntimeError):
    """A claim or lifecycle transition no longer owns the referenced part."""


class IngestionPartPublicationIntegrityError(RuntimeError):
    """A claimed part, batch position or exact wire payload failed verification."""


class IngestionPartPublicationRepository(Protocol):
    async def claim_pending(
        self,
        *,
        worker_id: str,
        limit: int,
        lease_expires_at: datetime,
    ) -> tuple[IngestionPartPublicationClaim, ...]: ...

    async def mark_published(
        self,
        *,
        claim_id: UUID,
        part_id: UUID,
        wire_digest: str,
        published_at: datetime,
    ) -> None: ...

    async def release_for_retry(
        self,
        *,
        claim_id: UUID,
        part_id: UUID,
        error: str,
        next_attempt_at: datetime,
    ) -> None: ...

    async def mark_failed(
        self,
        *,
        claim_id: UUID,
        part_id: UUID,
        error: str,
        failed_at: datetime,
    ) -> None: ...

    async def quarantine(
        self,
        *,
        claim_id: UUID,
        part_id: UUID,
        reason: str,
        quarantined_at: datetime,
    ) -> None: ...

    async def recover_missing_references(self, *, limit: int) -> int: ...
