from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.repositories.ingestion_part_publication import (
    IngestionPartPublicationConflictError,
)
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)


async def release_for_retry(
    session: AsyncSession,
    *,
    claim_id: UUID,
    part_id: UUID,
    error: str,
    next_attempt_at: datetime,
) -> None:
    released_at = datetime.now(UTC)
    result = await session.execute(
        update(VkIngestionPartReference)
        .where(
            VkIngestionPartReference.part_id == part_id,
            VkIngestionPartReference.claim_id == claim_id,
            VkIngestionPartReference.status == "pending",
            VkIngestionPartReference.claim_expires_at > released_at,
        )
        .values(
            claim_id=None,
            claimed_by=None,
            claim_expires_at=None,
            last_error=error,
            next_attempt_at=next_attempt_at,
            updated_at=released_at,
        )
    )
    if result.rowcount != 1:
        raise IngestionPartPublicationConflictError(
            "publication retry lost or expired its claim"
        )
