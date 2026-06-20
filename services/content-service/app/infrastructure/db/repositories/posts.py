from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.mappers.common import serialize_datetime
from app.infrastructure.db.models import ContentComment, ContentPost
from app.infrastructure.db.repositories.pagination import BaseContentRepository


class MessageRepository(BaseContentRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session)

    async def list_posts(self, page: int, limit: int) -> dict:
        rows, total = await self._paginate(
            select(ContentPost),
            page,
            limit,
            ContentPost.date.desc().nulls_last(),
            ContentPost.id.desc(),
        )
        return self._page(
            [self.post_to_dict(row) for row in rows], total, page, limit
        )

    async def get_post(self, external_key: str) -> dict | None:
        row = await self.session.scalar(
            select(ContentPost).where(
                ContentPost.external_key == external_key
            )
        )
        return self.post_to_dict(row) if row else None

    async def list_comments(self, page: int, limit: int) -> dict:
        rows, total = await self._paginate(
            select(ContentComment),
            page,
            limit,
            ContentComment.date.desc().nulls_last(),
            ContentComment.id.desc(),
        )
        return self._page(
            [self.comment_to_dict(row) for row in rows], total, page, limit
        )

    async def list_posts_bulk(self, external_keys: list[str]) -> list[dict]:
        rows = await self.session.scalars(
            select(ContentPost).where(
                ContentPost.external_key.in_(external_keys)
            )
        )
        return [self.post_to_dict(row) for row in rows]

    def post_to_dict(self, row: ContentPost) -> dict:
        return {
            "id": row.id,
            "externalKey": row.external_key,
            "vkOwnerId": row.vk_owner_id,
            "vkPostId": row.vk_post_id,
            "vkGroupId": row.vk_group_id,
            "authorVkId": row.author_vk_id,
            "date": serialize_datetime(row.date),
            "text": row.text,
            "commentsCount": row.comments_count,
            "lastCollectedTaskId": row.last_collected_task_id,
            "updatedAt": serialize_datetime(row.updated_at),
        }

    def comment_to_dict(self, row: ContentComment) -> dict:
        return {
            "id": row.id,
            "externalKey": row.external_key,
            "postExternalKey": row.post_external_key,
            "vkOwnerId": row.vk_owner_id,
            "vkPostId": row.vk_post_id,
            "vkCommentId": row.vk_comment_id,
            "authorVkId": row.author_vk_id,
            "date": serialize_datetime(row.date),
            "text": row.text,
            "lastCollectedTaskId": row.last_collected_task_id,
            "updatedAt": serialize_datetime(row.updated_at),
        }
