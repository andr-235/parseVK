from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import VkAuthor, VkComment, VkGroup, VkPost


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def vk_timestamp(value: int | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromtimestamp(int(value), timezone.utc)


class IngestionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert_group(self, group: dict) -> None:
        now = utcnow()
        stmt = insert(VkGroup).values(
            vk_group_id=int(group["id"]),
            screen_name=group.get("screen_name"),
            name=group.get("name"),
            is_closed=bool(group.get("is_closed")) if group.get("is_closed") is not None else None,
            raw=group,
            first_seen_at=now,
            last_seen_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[VkGroup.vk_group_id],
            set_={
                "screen_name": stmt.excluded.screen_name,
                "name": stmt.excluded.name,
                "is_closed": stmt.excluded.is_closed,
                "raw": stmt.excluded.raw,
                "last_seen_at": now,
            },
        )
        await self.session.execute(stmt)

    async def upsert_author(self, author: dict) -> None:
        now = utcnow()
        stmt = insert(VkAuthor).values(
            vk_author_id=int(author["vk_author_id"]),
            type=author["type"],
            display_name=author.get("display_name"),
            raw=author.get("raw") or author,
            first_seen_at=now,
            last_seen_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[VkAuthor.vk_author_id],
            set_={
                "type": stmt.excluded.type,
                "display_name": stmt.excluded.display_name,
                "raw": stmt.excluded.raw,
                "last_seen_at": now,
            },
        )
        await self.session.execute(stmt)

    async def upsert_post(self, post: dict, *, task_id: int, group_id: int | None = None) -> None:
        now = utcnow()
        stmt = insert(VkPost).values(
            vk_post_id=int(post["id"]),
            vk_owner_id=int(post["owner_id"]),
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

    async def upsert_comment(self, comment: dict, *, task_id: int) -> None:
        now = utcnow()
        stmt = insert(VkComment).values(
            vk_comment_id=int(comment["id"]),
            vk_owner_id=int(comment["owner_id"]),
            vk_post_id=int(comment["post_id"]),
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
