from __future__ import annotations

from typing import Any

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentAuthor, ContentComment, ContentPost
from app.modules.ingestion.canonical_helpers import author_update_fields, utcnow, vk_timestamp


async def upsert_author(session: AsyncSession, author: dict[str, Any]) -> None:
    now = utcnow()
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
    update_values = {
        field: getattr(stmt.excluded, field) for field in author_update_fields(author)
    }
    update_values["updated_at"] = now
    stmt = stmt.on_conflict_do_update(
        index_elements=[ContentAuthor.vk_author_id],
        set_=update_values,
    )
    await session.execute(stmt)


async def upsert_post(session: AsyncSession, post: dict[str, Any]) -> None:
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
    await session.execute(stmt)


async def upsert_comment(session: AsyncSession, comment: dict[str, Any]) -> None:
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
    await session.execute(stmt)
