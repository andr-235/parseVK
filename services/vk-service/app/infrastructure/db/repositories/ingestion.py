from datetime import UTC, datetime

from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.vk_ingestion import VkAuthor, VkComment, VkGroup, VkPost
from app.domain.repositories.ingestion import IngestionRepository


def utcnow() -> datetime:
    return datetime.now(UTC)

def vk_timestamp(value: int | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromtimestamp(int(value), UTC)

class SqlAlchemyIngestionRepository(IngestionRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert_group(self, group: dict, revive_if_deleted: bool = False) -> None:
        now = utcnow()
        vk_group_id = int(group["id"])
        if not revive_if_deleted:
            existing = await self.session.scalar(
                select(VkGroup.deleted_at).where(
                    VkGroup.vk_group_id == vk_group_id,
                    VkGroup.deleted_at.isnot(None),
                )
            )
            if existing is not None:
                return
        values = {
            "vk_group_id": vk_group_id,
            "screen_name": group.get("screen_name"),
            "name": group.get("name"),
            "is_closed": bool(group.get("is_closed")) if group.get("is_closed") is not None else None,
            "raw": group,
            "first_seen_at": now,
            "last_seen_at": now,
        }
        if revive_if_deleted:
            values["deleted_at"] = None
        stmt = insert(VkGroup).values(**values)
        update_set = {
            "screen_name": stmt.excluded.screen_name,
            "name": stmt.excluded.name,
            "is_closed": stmt.excluded.is_closed,
            "raw": stmt.excluded.raw,
            "last_seen_at": now,
        }
        if revive_if_deleted:
            update_set["deleted_at"] = None
        stmt = stmt.on_conflict_do_update(
            index_elements=[VkGroup.vk_group_id],
            set_=update_set,
        )
        await self.session.execute(stmt)

    async def get_active_group_ids(self) -> list[int]:
        result = await self.session.scalars(
            select(VkGroup.vk_group_id).where(VkGroup.deleted_at.is_(None))
        )
        return list(result.all())

    async def soft_delete_group(self, vk_group_id: int) -> bool:
        now = utcnow()
        owner_id = -vk_group_id

        # Проверка существования
        group_exists = await self.session.scalar(
            select(VkGroup.vk_group_id).where(
                VkGroup.vk_group_id == vk_group_id,
                VkGroup.deleted_at.is_(None),
            )
        )
        if group_exists is None:
            return True

        # Мягкое удаление группы
        await self.session.execute(
            update(VkGroup).where(VkGroup.vk_group_id == vk_group_id).values(deleted_at=now)
        )

        # Удаление постов и комментариев
        post_ids = (
            await self.session.scalars(
                select(VkPost.vk_post_id).where(
                    or_(
                        VkPost.vk_group_id == vk_group_id,
                        VkPost.vk_owner_id == owner_id,
                    )
                )
            )
        ).all()

        if post_ids:
            await self.session.execute(delete(VkComment).where(VkComment.vk_post_id.in_(post_ids)))
            await self.session.execute(
                delete(VkPost).where(VkPost.vk_post_id.in_(post_ids))
            )

        # Удаление автора, если нет контента
        author_has_content = await self.session.scalar(
            select(func.count()).select_from(
                select(VkPost.vk_post_id).where(VkPost.author_vk_id == owner_id).union(
                    select(VkComment.vk_comment_id).where(VkComment.author_vk_id == owner_id)
                ).subquery()
            )
        )
        if (author_has_content or 0) == 0:
            await self.session.execute(delete(VkAuthor).where(VkAuthor.vk_author_id == owner_id))

        return True

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
