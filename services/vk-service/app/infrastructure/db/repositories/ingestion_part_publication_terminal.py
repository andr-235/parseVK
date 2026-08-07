from datetime import datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_parts import FAILED, PREPARED, QUARANTINED
from app.domain.entities.ingestion_staging import FAILED as BATCH_FAILED
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


async def mark_failed(
    session: AsyncSession,
    *,
    claim_id: UUID,
    part_id: UUID,
    error: str,
    failed_at: datetime,
) -> None:
    await _terminate_batch(
        session,
        claim_id=claim_id,
        part_id=part_id,
        status=FAILED,
        batch_status=BATCH_FAILED,
        reason=error,
        terminal_at=failed_at,
        timestamp_field="failed_at",
    )


async def quarantine(
    session: AsyncSession,
    *,
    claim_id: UUID,
    part_id: UUID,
    reason: str,
    quarantined_at: datetime,
) -> None:
    await _terminate_batch(
        session,
        claim_id=claim_id,
        part_id=part_id,
        status=QUARANTINED,
        batch_status=BATCH_QUARANTINED,
        reason=reason,
        terminal_at=quarantined_at,
        timestamp_field="quarantined_at",
    )


async def _terminate_batch(
    session: AsyncSession,
    *,
    claim_id: UUID,
    part_id: UUID,
    status: str,
    batch_status: str,
    reason: str,
    terminal_at: datetime,
    timestamp_field: str,
) -> None:
    batch_id = await session.scalar(
        select(VkIngestionStagingPart.batch_id)
        .join(
            VkIngestionPartReference,
            VkIngestionPartReference.part_id == VkIngestionStagingPart.id,
        )
        .where(
            VkIngestionStagingPart.id == part_id,
            VkIngestionStagingPart.status == PREPARED,
            VkIngestionPartReference.claim_id == claim_id,
            VkIngestionPartReference.status == "pending",
            VkIngestionPartReference.claim_expires_at > terminal_at,
        )
        .with_for_update()
    )
    if batch_id is None:
        raise IngestionPartPublicationConflictError(
            "terminal publication transition lost or expired its claim"
        )

    part_ids = select(VkIngestionStagingPart.id).where(
        VkIngestionStagingPart.batch_id == batch_id
    )
    reference_values = {
        "status": status,
        "claim_id": None,
        "claimed_by": None,
        "claim_expires_at": None,
        "last_error": reason,
        timestamp_field: terminal_at,
        "updated_at": terminal_at,
    }
    await session.execute(
        update(VkIngestionPartReference)
        .where(
            VkIngestionPartReference.part_id.in_(part_ids),
            VkIngestionPartReference.status == "pending",
        )
        .values(**reference_values)
    )
    await session.execute(
        update(VkIngestionStagingPart)
        .where(
            VkIngestionStagingPart.batch_id == batch_id,
            VkIngestionStagingPart.status == PREPARED,
        )
        .values(status=status, updated_at=terminal_at)
    )
    batch = await session.execute(
        update(VkIngestionStagingBatch)
        .where(
            VkIngestionStagingBatch.id == batch_id,
            VkIngestionStagingBatch.status == BATCH_PREPARED,
        )
        .values(status=batch_status, updated_at=terminal_at)
    )
    if batch.rowcount != 1:
        raise IngestionPartPublicationConflictError(
            "terminal publication transition found an incompatible batch"
        )
