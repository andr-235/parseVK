import logging
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.repositories.checkpoint import CheckpointData, IngestionCheckpointStore
from app.infrastructure.db.models.vk_ingestion import VkIngestionCheckpoint

logger = logging.getLogger(__name__)


def utcnow() -> datetime:
    return datetime.now(UTC)


class SqlAlchemyIngestionCheckpointStore(IngestionCheckpointStore):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def load(self, run_id: str, owner_id: int, post_id: int) -> CheckpointData | None:
        logger.debug(
            "Loading checkpoint run_id=%s owner_id=%d post_id=%d",
            run_id,
            owner_id,
            post_id,
        )
        stmt = select(VkIngestionCheckpoint).where(
            VkIngestionCheckpoint.run_id == run_id,
            VkIngestionCheckpoint.owner_id == owner_id,
            VkIngestionCheckpoint.post_id == post_id,
        )
        result = await self.session.execute(stmt)
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return CheckpointData(
            run_id=row.run_id,
            owner_id=row.owner_id,
            post_id=row.post_id,
            task_id=row.task_id,
            group_id=row.group_id,
            next_offset=row.next_offset,
            last_comment_id=row.last_comment_id,
            last_comment_date=row.last_comment_date,
            processed_comments=row.processed_comments,
            status=row.status,
            last_error=row.last_error,
        )

    async def save(self, checkpoint: CheckpointData) -> None:
        logger.debug(
            "Saving checkpoint run_id=%s owner_id=%d post_id=%d "
            "next_offset=%d status=%s processed_comments=%d",
            checkpoint.run_id,
            checkpoint.owner_id,
            checkpoint.post_id,
            checkpoint.next_offset,
            checkpoint.status,
            checkpoint.processed_comments,
        )
        now = utcnow()
        stmt = pg_insert(VkIngestionCheckpoint).values(
            run_id=checkpoint.run_id,
            owner_id=checkpoint.owner_id,
            post_id=checkpoint.post_id,
            task_id=checkpoint.task_id,
            group_id=checkpoint.group_id,
            next_offset=checkpoint.next_offset,
            last_comment_id=checkpoint.last_comment_id,
            last_comment_date=checkpoint.last_comment_date,
            processed_comments=checkpoint.processed_comments,
            status=checkpoint.status,
            last_error=checkpoint.last_error,
            updated_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            constraint="uq_vk_ingestion_checkpoints_run_owner_post",
            set_={
                "next_offset": checkpoint.next_offset,
                "last_comment_id": checkpoint.last_comment_id,
                "last_comment_date": checkpoint.last_comment_date,
                "processed_comments": checkpoint.processed_comments,
                "status": checkpoint.status,
                "last_error": checkpoint.last_error,
                "updated_at": now,
            },
        )
        await self.session.execute(stmt)

    async def complete(self, run_id: str, owner_id: int, post_id: int) -> None:
        stmt = (
            update(VkIngestionCheckpoint)
            .where(
                VkIngestionCheckpoint.run_id == run_id,
                VkIngestionCheckpoint.owner_id == owner_id,
                VkIngestionCheckpoint.post_id == post_id,
            )
            .values(status="completed", updated_at=utcnow())
        )
        await self.session.execute(stmt)
        logger.info("Checkpoint completed for run_id=%s owner_id=%d post_id=%d", run_id, owner_id, post_id)

    async def fail(self, run_id: str, owner_id: int, post_id: int, error: str) -> None:
        stmt = (
            update(VkIngestionCheckpoint)
            .where(
                VkIngestionCheckpoint.run_id == run_id,
                VkIngestionCheckpoint.owner_id == owner_id,
                VkIngestionCheckpoint.post_id == post_id,
            )
            .values(status="failed", last_error=error, updated_at=utcnow())
        )
        await self.session.execute(stmt)
        logger.info("Checkpoint failed for run_id=%s owner_id=%d post_id=%d: %s", run_id, owner_id, post_id, error)
