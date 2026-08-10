from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_parts import APPLIED, PREPARED, PUBLISHED
from app.domain.entities.ingestion_staging import APPLIED as BATCH_APPLIED
from app.domain.entities.ingestion_staging import PREPARED as BATCH_PREPARED
from app.domain.entities.ingestion_staging import PUBLISHED as BATCH_PUBLISHED
from app.domain.repositories.ingestion_part_publication import (
    IngestionPartPublicationConflictError,
)
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch


async def mark_published(
    session: AsyncSession,
    *,
    claim_id: UUID,
    part_id: UUID,
    wire_digest: str,
    published_at: datetime,
) -> None:
    reference = await session.execute(
        update(VkIngestionPartReference)
        .where(
            VkIngestionPartReference.part_id == part_id,
            VkIngestionPartReference.claim_id == claim_id,
            VkIngestionPartReference.status == "pending",
            VkIngestionPartReference.claim_expires_at > published_at,
        )
        .values(
            status=PUBLISHED,
            claim_id=None,
            claimed_by=None,
            claim_expires_at=None,
            last_error=None,
            published_at=published_at,
            updated_at=published_at,
        )
    )
    if reference.rowcount != 1:
        if await _already_applied(session, part_id, wire_digest):
            return
        raise IngestionPartPublicationConflictError(
            "publication claim no longer owns the pending reference"
        )
    part = await session.execute(
        update(VkIngestionStagingPart)
        .where(
            VkIngestionStagingPart.id == part_id,
            VkIngestionStagingPart.status == PREPARED,
            VkIngestionStagingPart.wire_digest == wire_digest,
        )
        .values(status=PUBLISHED, updated_at=published_at)
        .returning(VkIngestionStagingPart.batch_id)
    )
    batch_id = part.scalar_one_or_none()
    if batch_id is None:
        if await _already_applied(session, part_id, wire_digest):
            return
        raise IngestionPartPublicationConflictError(
            "published part identity or wire digest changed"
        )
    await _mark_batch_if_complete(session, batch_id, published_at)


async def _already_applied(
    session: AsyncSession,
    part_id: UUID,
    wire_digest: str,
) -> bool:
    row = (
        await session.execute(
            select(VkIngestionStagingPart.status, VkIngestionPartReference.status)
            .join(
                VkIngestionPartReference,
                VkIngestionPartReference.part_id == VkIngestionStagingPart.id,
            )
            .where(
                VkIngestionStagingPart.id == part_id,
                VkIngestionStagingPart.wire_digest == wire_digest,
            )
        )
    ).one_or_none()
    return row is not None and row[0] == APPLIED and row[1] == APPLIED


async def _mark_batch_if_complete(
    session: AsyncSession,
    batch_id: UUID,
    published_at: datetime,
) -> None:
    remaining = await session.scalar(
        select(func.count())
        .select_from(VkIngestionPartReference)
        .join(
            VkIngestionStagingPart,
            VkIngestionStagingPart.id == VkIngestionPartReference.part_id,
        )
        .where(
            VkIngestionStagingPart.batch_id == batch_id,
            VkIngestionPartReference.status.notin_([PUBLISHED, APPLIED]),
        )
    )
    if remaining:
        return
    result = await session.execute(
        update(VkIngestionStagingBatch)
        .where(
            VkIngestionStagingBatch.id == batch_id,
            VkIngestionStagingBatch.status == BATCH_PREPARED,
        )
        .values(status=BATCH_PUBLISHED, updated_at=published_at)
    )
    if result.rowcount == 1:
        return
    status = await session.scalar(
        select(VkIngestionStagingBatch.status).where(
            VkIngestionStagingBatch.id == batch_id
        )
    )
    if status in {BATCH_PUBLISHED, BATCH_APPLIED}:
        return
    raise IngestionPartPublicationConflictError(
        "complete publication found an incompatible batch state"
    )
