from datetime import UTC, datetime

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.mappers.groups import normalize_group_fields
from app.infrastructure.db.models import (
    ContentAuthor,
    ContentComment,
    ContentGroup,
    ContentPost,
)
from app.infrastructure.db.repositories.processed_events import (
    SqlAlchemyProcessedEventRepository,
)


def _timestamp(value: int | None):
    return datetime.fromtimestamp(value, UTC) if value is not None else None


class VkProjectionRepository(SqlAlchemyProcessedEventRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session)

    async def upsert_group(self, group: dict) -> None:
        values = normalize_group_fields(group)
        values["last_collected_at"] = datetime.now(UTC)
        statement = insert(ContentGroup).values(**values)
        statement = statement.on_conflict_do_update(
            index_elements=[ContentGroup.vk_group_id],
            set_={key: getattr(statement.excluded, key) for key in values if key != "vk_group_id"},
        )
        await self.session.execute(statement)

    async def delete_group(self, vk_group_id: int) -> None:
        await self.session.execute(
            delete(ContentComment).where(ContentComment.vk_owner_id == -vk_group_id)
        )
        await self.session.execute(
            delete(ContentPost).where(ContentPost.vk_owner_id == -vk_group_id)
        )
        await self.session.execute(
            delete(ContentGroup).where(ContentGroup.vk_group_id == vk_group_id)
        )

    async def upsert_author(self, author: dict) -> None:
        now = datetime.now(UTC)
        values = {
            "vk_author_id": int(author["vk_author_id"]),
            "type": author["type"],
            "display_name": author.get("display_name"),
            "first_name": author.get("first_name"),
            "last_name": author.get("last_name"),
            "photo_50": author.get("photo_50"),
            "photo_100": author.get("photo_100"),
            "photo_200": author.get("photo_200"),
            "domain": author.get("domain"),
            "screen_name": author.get("screen_name"),
            "created_at": now,
            "updated_at": now,
        }
        statement = insert(ContentAuthor).values(**values)
        statement = statement.on_conflict_do_update(
            index_elements=[ContentAuthor.vk_author_id],
            set_={key: getattr(statement.excluded, key) for key in values if key not in {"vk_author_id", "created_at"}},
        )
        await self.session.execute(statement)

    async def upsert_post(self, post: dict, *, task_id: int | None = None) -> None:
        owner_id = int(post.get("owner_id", 0))
        post_id = int(post.get("id", 0))
        values = {
            "external_key": f"{owner_id}:{post_id}",
            "vk_owner_id": owner_id,
            "vk_post_id": post_id,
            "vk_group_id": abs(owner_id) if owner_id < 0 else None,
            "author_vk_id": post.get("from_id"),
            "date": _timestamp(post.get("date")),
            "text": post.get("text"),
            "last_collected_task_id": task_id,
            "updated_at": datetime.now(UTC),
        }
        await self._upsert_content(ContentPost, values, "external_key")

    async def upsert_comment(self, comment: dict, *, task_id: int | None = None) -> None:
        owner_id = int(comment.get("owner_id", 0))
        post_id = int(comment.get("post_id", 0))
        values = {
            "external_key": f"{owner_id}:{post_id}:{int(comment.get('id', 0))}",
            "post_external_key": f"{owner_id}:{post_id}",
            "vk_owner_id": owner_id,
            "vk_post_id": post_id,
            "vk_comment_id": int(comment.get("id", 0)),
            "author_vk_id": comment.get("from_id"),
            "date": _timestamp(comment.get("date")),
            "text": comment.get("text"),
            "last_collected_task_id": task_id,
            "updated_at": datetime.now(UTC),
        }
        await self._upsert_content(ContentComment, values, "external_key")

    async def sync_post_comments_count(self, external_key: str) -> None:
        count = select(func.count(ContentComment.id)).where(
            ContentComment.post_external_key == external_key
        ).scalar_subquery()
        await self.session.execute(
            ContentPost.__table__.update()
            .where(ContentPost.external_key == external_key)
            .values(comments_count=count, updated_at=datetime.now(UTC))
        )

    async def _upsert_content(self, model, values: dict, key: str) -> None:
        statement = insert(model).values(**values)
        statement = statement.on_conflict_do_update(
            index_elements=[getattr(model, key)],
            set_={name: getattr(statement.excluded, name) for name in values if name != key},
        )
        await self.session.execute(statement)
