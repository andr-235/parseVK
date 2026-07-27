from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.repositories.comments import CommentRepository
from app.infrastructure.db.models.vk_ingestion import VkComment


def utcnow() -> datetime:
    return datetime.now(UTC)

def vk_timestamp(value: int | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromtimestamp(int(value), UTC)

class SqlAlchemyCommentRepository(CommentRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert_comment(self, comment: dict, task_id: int) -> None:
        now = utcnow()
        stmt = insert(VkComment).values(
            vk_comment_id=int(comment.get("id", 0)),
            vk_owner_id=int(comment.get("owner_id", 0)),
            vk_post_id=int(comment.get("post_id", 0)),
            author_vk_id=comment.get("from_id"),
            date=vk_timestamp(comment.get("date")),
            text=comment.get("text"),
            raw=comment,
            first_task_id=task_id,
            last_task_id=task_id,
            first_seen_at=now,
            last_seen_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[VkComment.vk_owner_id, VkComment.vk_post_id, VkComment.vk_comment_id],
            set_={
                "author_vk_id": stmt.excluded.author_vk_id,
                "date": stmt.excluded.date,
                "text": stmt.excluded.text,
                "raw": stmt.excluded.raw,
                "last_task_id": task_id,
                "last_seen_at": now,
            },
        )
        await self.session.execute(stmt)

    async def count_for_post(self, owner_id: int, post_id: int) -> int:
        stmt = select(func.count()).where(
            VkComment.vk_owner_id == owner_id,
            VkComment.vk_post_id == post_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0
