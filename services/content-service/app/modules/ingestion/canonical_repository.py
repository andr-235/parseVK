from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentAuthor, ContentComment, ContentPost
from app.modules.ingestion.canonical_helpers import flatten_comments, utcnow
from app.modules.ingestion.canonical_upserts import upsert_author, upsert_comment, upsert_post
from app.modules.ingestion.contract import IngestionPartEnvelope


class CanonicalIngestionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def apply(self, part: IngestionPartEnvelope) -> dict[str, int]:
        owner_id = int(part.source["ownerId"])
        post_id = int(part.source["postId"])
        post_key = f"{owner_id}:{post_id}"
        comments = flatten_comments(part.comments, owner_id, post_id)
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
            await upsert_author(self.session, author)
        await upsert_post(self.session, part.post)
        for comment in comments:
            await upsert_comment(self.session, comment)
        if comments:
            await self._refresh_comment_count(post_key)
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

    async def _refresh_comment_count(self, post_key: str) -> None:
        count = await self.session.scalar(
            select(func.count(ContentComment.id)).where(
                ContentComment.post_external_key == post_key
            )
        )
        await self.session.execute(
            ContentPost.__table__.update()
            .where(ContentPost.external_key == post_key)
            .values(comments_count=count or 0, updated_at=utcnow())
        )
