from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.ingestion_part_publication import VkIngestionPartReference
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.services.ingestion.lifecycle_metrics import observe_purge_latency
from app.services.ingestion.purge_manifest import build_purge_manifest


async def purge_eligible_batches(
    session: AsyncSession,
    *,
    older_than: datetime,
    limit: int,
    purged_at: datetime,
) -> int:
    if not 1 <= limit <= 500:
        raise ValueError("purge limit must be between 1 and 500")
    statement = (
        select(VkIngestionStagingBatch)
        .where(
            VkIngestionStagingBatch.status == "applied",
            VkIngestionStagingBatch.applied_at.is_not(None),
            VkIngestionStagingBatch.applied_at <= older_than,
        )
        .order_by(VkIngestionStagingBatch.applied_at, VkIngestionStagingBatch.id)
        .limit(limit)
    )
    if session.get_bind().dialect.name == "postgresql":
        statement = statement.with_for_update(of=VkIngestionStagingBatch, skip_locked=True)
    batches = (await session.scalars(statement)).all()
    purged = 0
    for batch in batches:
        rows = (
            await session.execute(
                select(VkIngestionStagingPart, VkIngestionPartReference)
                .join(VkIngestionPartReference, VkIngestionPartReference.part_id == VkIngestionStagingPart.id)
                .where(VkIngestionStagingPart.batch_id == batch.id)
                .order_by(VkIngestionStagingPart.part_kind, VkIngestionStagingPart.part_index)
            )
        ).all()
        manifest = build_purge_manifest(batch, list(rows))
        batch.purge_manifest = manifest
        batch.payload = None
        batch.status = "payload_purged"
        batch.payload_purged_at = purged_at
        batch.updated_at = purged_at
        for part, _reference in rows:
            part.wire_bytes = None
            part.status = "payload_purged"
            part.payload_purged_at = purged_at
            part.updated_at = purged_at
        observe_purge_latency(applied_at=batch.applied_at, purged_at=purged_at)
        purged += 1
    await session.flush()
    return purged
