from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ingestion_parts import PREPARED
from app.domain.entities.ingestion_staging import PREPARED as BATCH_PREPARED
from app.infrastructure.db.models.ingestion_part_publication import (
    VkIngestionPartReference,
)
from app.infrastructure.db.models.ingestion_parts import VkIngestionStagingPart
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch


async def recover_missing_references(
    session: AsyncSession,
    *,
    limit: int,
) -> int:
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
    if session.get_bind().dialect.name == "postgresql":
        statement = statement.with_for_update(
            of=VkIngestionStagingPart,
            skip_locked=True,
        )
    part_ids = (await session.scalars(statement)).all()
    inserted = 0
    for part_id in part_ids:
        result = await session.execute(_reference_insert(session, part_id))
        inserted += int(result.rowcount == 1)
    await session.flush()
    return inserted


def _reference_insert(session: AsyncSession, part_id: UUID):
    dialect = session.get_bind().dialect.name
    values = {"part_id": part_id, "status": "pending"}
    if dialect == "postgresql":
        statement = postgresql_insert(VkIngestionPartReference).values(**values)
    elif dialect == "sqlite":
        statement = sqlite_insert(VkIngestionPartReference).values(**values)
    else:
        raise RuntimeError(f"unsupported publication dialect: {dialect}")
    return statement.on_conflict_do_nothing()
