from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentAuthor, ContentComment, ContentPost
from app.modules.ingestion.contract import IngestionPartEnvelope


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _vk_timestamp(value: int | None) -> datetime | None:
    return datetime.fromtimestamp(int(value), UTC) if value is not None else None


def _flatten_comments(
    comments: tuple[dict[str, Any], ...], owner_id: int, post_id: int
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for value in comments:
        comment = dict(value)
        comment.setdefault("owner_id", owner_id)
        comment.setdefault("post_id", post_id)
        result.append(comment)
        thread = comment.get("thread")
        if isinstance(thread, dict):
            children = tuple(dict(item) for item in thread.get("items") or [])
            result.extend(_flatten_comments(children, owner_id, post_id))
    return result


class CanonicalIngestionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def apply(self, part: IngestionPartEnvelope) -> dict[str, int]:
        owner_id = int(part.source["ownerId"])
        post_id = int(part.source["postId"])
        post_key = f"{owner_id}:{post_id}"
        comments = _flatten_comments(part.comments, owner_id, post_id)
        author_ids = {int(author["vkAuthorId"]) for author in part.authors}
        comment_keys = {
            f"{int(item['owner_id'])}:{int(item['post_id'])}:{int(item['id'])}"
            for item in comments
        }
        post_exists = await self.session.scalar(
            select(ContentPost.id).where(ContentPost.external_key == post_key)
        )
        existing_authors = await self._existing_authors(author_ids)
        existing_comments = await self._existing_comments(comment_keys)
        for author in part.authors:
            await self._upsert_author(author)
        await self._upsert_post(part.post)
        for comment in comments:
            await self._upsert_comment(comment)
        if comments:
            count = await self.session.scalar(
                select(func.count(ContentComment.id)).where(
                    ContentComment.post_external_key == post_key
                )
            )
            await self.session.execute(
                ContentPost.__table__.update()
                .where(ContentPost.external_key == post_key)
                .values(comments_count=count or 0, updated_at=_utcnow())
            )
        return {
            "postsInserted": 0 if post_exists else 1,
            "postsUpdated": 1 if post_exists else 0,
            "authorsInserted": len(author_ids - existing_authors),
            "authorsUpdated": len(author_ids & existing_authors),
            "commentsInserted": len(comment_keys - existing_comments),
            "commentsUpdated": len(comment_keys & existing_comments),
        }

    async def _existing_authors(self, ids: set[int]) -> set[int]:
        if not ids:
            return set()
        values = await self.session.scalars(
            select(ContentAuthor.vk_author_id).where(ContentAuthor.vk_author_id.in_(ids))
        )
        return set(values.all())

    async def _existing_comments(self, keys: set[str]) -> set[str]:
        if not keys:
            return set()
        values = await self.session.scalars(
            select(ContentComment.external_key).where(ContentComment.external_key.in_(keys))
        )
        return set(values.all())

    async def _upsert_author(self, author: dict[str, Any]) -> None:
        now = _utcnow()
        provider = dict(author.get("providerData") or {})
        author_id = int(author["vkAuthorId"])
        stmt = insert(ContentAuthor).values(
            vk_author_id=author_id,
            type=author["type"],
            display_name=author.get("displayName"),
            first_name=provider.get("first_name"),
            last_name=provider.get("last_name"),
            photo_50=provider.get("photo_50"),
            photo_100=provider.get("photo_100"),
            photo_200=provider.get("photo_200"),
            domain=provider.get("domain"),
            screen_name=provider.get("screen_name"),
            created_at=now,
            updated_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[ContentAuthor.vk_author_id],
            set_={
                "type": stmt.excluded.type,
                "display_name": stmt.excluded.display_name,
                "first_name": stmt.excluded.first_name,
                "last_name": stmt.excluded.last_name,
                "photo_50": stmt.excluded.photo_50,
                "photo_100": stmt.excluded.photo_100,
                "photo_200": stmt.excluded.photo_200,
                "domain": stmt.excluded.domain,
                "screen_name": stmt.excluded.screen_name,
                "updated_at": now,
            },
        )
        await self.session.execute(stmt)

    async def _upsert_post(self, post: dict[str, Any]) -> None:
        now = _utcnow()
        owner_id = int(post["owner_id"])
        post_id = int(post["id"])
        stmt = insert(ContentPost).values(
            external_key=f"{owner_id}:{post_id}",
            vk_owner_id=owner_id,
            vk_post_id=post_id,
            vk_group_id=abs(owner_id) if owner_id < 0 else None,
            author_vk_id=post.get("from_id"),
            date=_vk_timestamp(post.get("date")),
            text=post.get("text"),
            last_collected_task_id=None,
            updated_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[ContentPost.external_key],
            set_={
                "author_vk_id": stmt.excluded.author_vk_id,
                "date": stmt.excluded.date,
                "text": stmt.excluded.text,
                "updated_at": now,
            },
        )
        await self.session.execute(stmt)

    async def _upsert_comment(self, comment: dict[str, Any]) -> None:
        now = _utcnow()
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
            date=_vk_timestamp(comment.get("date")),
            text=comment.get("text"),
            last_collected_task_id=None,
            updated_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[ContentComment.external_key],
            set_={
                "author_vk_id": stmt.excluded.author_vk_id,
                "date": stmt.excluded.date,
                "text": stmt.excluded.text,
                "updated_at": now,
            },
        )
        await self.session.execute(stmt)
