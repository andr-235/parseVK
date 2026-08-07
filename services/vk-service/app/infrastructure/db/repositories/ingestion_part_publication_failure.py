from datetime import datetime
from uuid import UUID

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_parts import PREPARED, QUARANTINED
from app.domain.entities.ingestion_staging import PREPARED as BATCH_PREPARED
from app.domain.entities.ingestion_staging import QUARANTINED as BATCH_QUARANTINED
from app.domain.repositories.ingestion_part_publication import (
    IngestionPartPublicationConflictError,
)
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch


async def release_for_retry(
    session: AsyncSession,
    *,
    claim_id: UUID,
    part_id: UUID,
    error: str,
    next_attempt_at: datetime,
) -> None:
    result = await session.execute(
        update(VkIngestionPartReference)
        .where(
            VkIngestionPartReference.part_id == part_id,
            VkIngestionPartReference.claim_id == claim_id,
            VkIngestionPartReference.status == "pending",
        )
        .values(
            claim_id=None,
            claimed_by=None,
            claim_expires_at=None,
            last_error=error,
            next_attempt_at=next_attempt_at,
            updated_at=next_attempt_at,
        )
    )
    if result.rowcount != 1:
        raise IngestionPartPublicationConflictError(
            "publication retry lost its claim"
        )


async def quarantine(
    session: AsyncSession,
    *,
    claim_id: UUID,
    part_id: UUID,
    reason: str,
    quarantined_at: datetime,
) -> None:
    reference = await session.execute(
        update(VkIngestionPartReference)
        .where(
            VkIngestionPartReference.part_id == part_id,
            VkIngestionPartReference.claim_id == claim_id,
            VkIngestionPartReference.status == "pending",
        )
        .values(
            status=QUARANTINED,
            claim_id=None,
            claimed_by=None,
            claim_expires_at=None,
            last_error=reason,
            quarantined_at=quarantined_at,
            updated_at=quarantined_at,
        )
    )
    part = await session.execute(
        update(VkIngestionStagingPart)
        .where(
            VkIngestionStagingPart.id == part_id,
            VkIngestionStagingPart.status == PREPARED,
        )
        .values(status=QUARANTINED, updated_at=quarantined_at)
        .returning(VkIngestionStagingPart.batch_id)
    )
    batch_id = part.scalar_one_or_none()
    if reference.rowcount != 1 or batch_id is None:
        raise IngestionPartPublicationConflictError(
            "publication quarantine lost its claim or prepared part"
        )
    batch = await session.execute(
        update(VkIngestionStagingBatch)
        .where(
            VkIngestionStagingBatch.id == batch_id,
            VkIngestionStagingBatch.status == BATCH_PREPARED,
        )
        .values(status=BATCH_QUARANTINED, updated_at=quarantined_at)
    )
    if batch.rowcount != 1:
        raise IngestionPartPublicationConflictError(
            "publication quarantine found an incompatible batch state"
        )
