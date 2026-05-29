from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentAuthor, ContentComment, ContentGroup, ContentPost, ProcessedEvent

CONSUMER_NAME = "content-service.vk"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def vk_timestamp(value: int | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromtimestamp(int(value), timezone.utc)


class VkEvent(BaseModel):
    event_id: UUID
    event_type: str
    event_version: int
    aggregate_id: str
    correlation_id: str | None = None
    payload: dict[str, Any]

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)


class ProjectionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def is_processed(self, consumer_name: str, event_id: UUID) -> bool:
        return (
            await self.session.scalar(
                select(ProcessedEvent.id).where(
                    ProcessedEvent.consumer_name == consumer_name,
                    ProcessedEvent.event_id == event_id,
                )
            )
            is not None
        )

    async def mark_processed(self, consumer_name: str, event_id: UUID, event_type: str) -> None:
        self.session.add(ProcessedEvent(consumer_name=consumer_name, event_id=event_id, event_type=event_type))

    async def upsert_group(self, group: dict) -> None:
        now = utcnow()
        stmt = insert(ContentGroup).values(
            vk_group_id=int(group["id"]),
            screen_name=group.get("screen_name"),
            name=group.get("name"),
            last_collected_at=now,
            updated_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[ContentGroup.vk_group_id],
            set_={
                "screen_name": stmt.excluded.screen_name,
                "name": stmt.excluded.name,
                "last_collected_at": now,
                "updated_at": now,
            },
        )
        await self.session.execute(stmt)

    async def delete_group(self, vk_group_id: int) -> None:
        from sqlalchemy import delete
        await self.session.execute(delete(ContentComment).where(ContentComment.vk_owner_id == -vk_group_id))
        await self.session.execute(delete(ContentPost).where(ContentPost.vk_owner_id == -vk_group_id))
        await self.session.execute(delete(ContentGroup).where(ContentGroup.vk_group_id == vk_group_id))

    async def upsert_author(self, author: dict) -> None:
        now = utcnow()
        stmt = insert(ContentAuthor).values(
            vk_author_id=int(author["vk_author_id"]),
            type=author["type"],
            display_name=author.get("display_name"),
            updated_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[ContentAuthor.vk_author_id],
            set_={"type": stmt.excluded.type, "display_name": stmt.excluded.display_name, "updated_at": now},
        )
        await self.session.execute(stmt)

    async def upsert_post(self, post: dict, *, task_id: int | None = None) -> None:
        now = utcnow()
        owner_id = int(post["owner_id"])
        post_id = int(post["id"])
        stmt = insert(ContentPost).values(
            external_key=f"{owner_id}:{post_id}",
            vk_owner_id=owner_id,
            vk_post_id=post_id,
            vk_group_id=abs(owner_id) if owner_id < 0 else None,
            author_vk_id=post.get("from_id"),
            date=vk_timestamp(post.get("date")),
            text=post.get("text"),
            last_collected_task_id=task_id,
            updated_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[ContentPost.external_key],
            set_={
                "author_vk_id": stmt.excluded.author_vk_id,
                "date": stmt.excluded.date,
                "text": stmt.excluded.text,
                "last_collected_task_id": task_id,
                "updated_at": now,
            },
        )
        await self.session.execute(stmt)

    async def upsert_comment(self, comment: dict, *, task_id: int | None = None) -> None:
        now = utcnow()
        owner_id = int(comment["owner_id"])
        post_id = int(comment["post_id"])
        comment_id = int(comment["id"])
        stmt = insert(ContentComment).values(
            external_key=f"{owner_id}:{post_id}:{comment_id}",
            post_external_key=f"{owner_id}:{post_id}",
            vk_owner_id=owner_id,
            vk_post_id=post_id,
            vk_comment_id=comment_id,
            author_vk_id=comment.get("from_id"),
            date=vk_timestamp(comment.get("date")),
            text=comment.get("text"),
            last_collected_task_id=task_id,
            updated_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[ContentComment.external_key],
            set_={
                "author_vk_id": stmt.excluded.author_vk_id,
                "date": stmt.excluded.date,
                "text": stmt.excluded.text,
                "last_collected_task_id": task_id,
                "updated_at": now,
            },
        )
        await self.session.execute(stmt)

    async def increment_post_comments_count(self, post_external_key: str) -> None:
        # Projection is idempotent by event id; each new comment event increments the read counter once.
        await self.session.execute(
            ContentPost.__table__.update()
            .where(ContentPost.external_key == post_external_key)
            .values(comments_count=ContentPost.comments_count + 1, updated_at=utcnow())
        )

    async def save(self) -> None:
        await self.session.flush()


class ProjectionService:
    def __init__(self, repository, *, consumer_name: str = CONSUMER_NAME):
        self.repository = repository
        self.consumer_name = consumer_name

    async def handle(self, event: VkEvent) -> bool:
        if await self.repository.is_processed(self.consumer_name, event.event_id):
            return False
        if event.event_type == "vk.group_collected":
            await self.repository.upsert_group(event.payload["group"])
        elif event.event_type == "vk.group_deleted":
            await self.repository.delete_group(event.payload["vkGroupId"])
        elif event.event_type == "vk.author_collected":
            await self.repository.upsert_author(event.payload["author"])
        elif event.event_type == "vk.post_collected":
            await self.repository.upsert_post(event.payload["post"], task_id=event.payload.get("taskId"))
        elif event.event_type == "vk.comment_collected":
            comment = event.payload["comment"]
            await self.repository.upsert_comment(comment, task_id=event.payload.get("taskId"))
            await self.repository.increment_post_comments_count(f"{comment['owner_id']}:{comment['post_id']}")
        await self.repository.mark_processed(self.consumer_name, event.event_id, event.event_type)
        await self.repository.save()
        return True
