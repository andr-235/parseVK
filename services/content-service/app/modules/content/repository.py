from math import ceil

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentAuthor, ContentComment, ContentGroup, ContentPost
from app.modules.content.schemas import dt


class ContentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_groups(self, page: int, limit: int) -> dict:
        rows, total = await self._paginate(select(ContentGroup), page, limit, ContentGroup.id.desc())
        return self._page([self.group_to_dict(row) for row in rows], total, page, limit)

    async def get_group(self, vk_group_id: int) -> dict | None:
        row = await self.session.scalar(select(ContentGroup).where(ContentGroup.vk_group_id == vk_group_id))
        return self.group_to_dict(row) if row else None

    async def list_posts(self, page: int, limit: int) -> dict:
        rows, total = await self._paginate(
            select(ContentPost),
            page,
            limit,
            ContentPost.date.desc().nulls_last(),
            ContentPost.id.desc(),
        )
        return self._page([self.post_to_dict(row) for row in rows], total, page, limit)

    async def get_post(self, external_key: str) -> dict | None:
        row = await self.session.scalar(select(ContentPost).where(ContentPost.external_key == external_key))
        return self.post_to_dict(row) if row else None

    async def list_comments(self, page: int, limit: int) -> dict:
        rows, total = await self._paginate(
            select(ContentComment),
            page,
            limit,
            ContentComment.date.desc().nulls_last(),
            ContentComment.id.desc(),
        )
        return self._page([self.comment_to_dict(row) for row in rows], total, page, limit)

    async def list_authors(self, page: int, limit: int) -> dict:
        rows, total = await self._paginate(select(ContentAuthor), page, limit, ContentAuthor.id.desc())
        return self._page([self.author_to_dict(row) for row in rows], total, page, limit)

    async def get_author(self, vk_author_id: int) -> dict | None:
        row = await self.session.scalar(select(ContentAuthor).where(ContentAuthor.vk_author_id == vk_author_id))
        return self.author_to_dict(row) if row else None

    async def _paginate(self, stmt: Select, page: int, limit: int, *order_by) -> tuple[list, int]:
        offset = (page - 1) * limit
        total = await self.session.scalar(select(func.count()).select_from(stmt.subquery()))
        result = await self.session.scalars(stmt.order_by(*order_by).offset(offset).limit(limit))
        return list(result), int(total or 0)

    def _page(self, items: list[dict], total: int, page: int, limit: int) -> dict:
        total_pages = ceil(total / limit) if total else 0
        return {"items": items, "total": total, "page": page, "limit": limit, "totalPages": total_pages, "hasMore": page < total_pages}

    def group_to_dict(self, row: ContentGroup) -> dict:
        return {
            "id": row.id,
            "vkGroupId": row.vk_group_id,
            "screenName": row.screen_name,
            "name": row.name,
            "lastCollectedAt": dt(row.last_collected_at),
            "updatedAt": dt(row.updated_at),
        }

    def author_to_dict(self, row: ContentAuthor) -> dict:
        return {
            "id": row.id,
            "vkAuthorId": row.vk_author_id,
            "type": row.type,
            "displayName": row.display_name,
            "updatedAt": dt(row.updated_at),
        }

    def post_to_dict(self, row: ContentPost) -> dict:
        return {
            "id": row.id,
            "externalKey": row.external_key,
            "vkOwnerId": row.vk_owner_id,
            "vkPostId": row.vk_post_id,
            "vkGroupId": row.vk_group_id,
            "authorVkId": row.author_vk_id,
            "date": dt(row.date),
            "text": row.text,
            "commentsCount": row.comments_count,
            "lastCollectedTaskId": row.last_collected_task_id,
            "updatedAt": dt(row.updated_at),
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
            "date": dt(row.date),
            "text": row.text,
            "lastCollectedTaskId": row.last_collected_task_id,
            "updatedAt": dt(row.updated_at),
        }
