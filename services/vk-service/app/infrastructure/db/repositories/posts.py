from datetime import UTC, datetime

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.vk_ingestion import VkPost
from app.domain.repositories.posts import PostRepository


def utcnow() -> datetime:
    return datetime.now(UTC)

def vk_timestamp(value: int | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromtimestamp(int(value), UTC)

class SqlAlchemyPostRepository(PostRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert_post(self, post: dict, task_id: int, group_id: int | None = None) -> None:
        now = utcnow()
        stmt = insert(VkPost).values(
            vk_post_id=int(post.get("id", 0)),
            vk_owner_id=int(post.get("owner_id", 0)),
            vk_group_id=group_id,
            author_vk_id=post.get("from_id"),
            date=vk_timestamp(post.get("date")),
            text=post.get("text"),
            raw=post,
            first_task_id=task_id,
            last_task_id=task_id,
            first_seen_at=now,
            last_seen_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[VkPost.vk_owner_id, VkPost.vk_post_id],
            set_={
                "vk_group_id": stmt.excluded.vk_group_id,
                "author_vk_id": stmt.excluded.author_vk_id,
                "date": stmt.excluded.date,
                "text": stmt.excluded.text,
                "raw": stmt.excluded.raw,
                "last_task_id": task_id,
                "last_seen_at": now,
            },
        )
        await self.session.execute(stmt)
