from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_parts import PREPARED, PUBLISHED
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart


async def pending_ack_message_ids(
    session: AsyncSession,
    *,
    older_than: datetime,
    limit: int,
) -> tuple[UUID, ...]:
    rows = await session.scalars(
        select(VkIngestionStagingPart.id)
        .join(
            VkIngestionPartReference,
            VkIngestionPartReference.part_id == VkIngestionStagingPart.id,
        )
        .where(
            VkIngestionPartReference.status.in_(["pending", PUBLISHED]),
            VkIngestionPartReference.created_at <= older_than,
            VkIngestionStagingPart.status.in_([PREPARED, PUBLISHED]),
        )
        .order_by(VkIngestionPartReference.created_at, VkIngestionStagingPart.id)
        .limit(limit)
    )
    return tuple(rows)
