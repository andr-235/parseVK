from math import ceil

from sqlalchemy import Select, String, and_, cast, false, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentAuthor, ContentComment, ContentGroup, ContentPost
from app.modules.content.schemas import dt


class ContentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_groups(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        stmt = select(ContentGroup)
        if search:
            pattern = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(ContentGroup.name).like(pattern),
                    func.lower(ContentGroup.screen_name).like(pattern),
                    cast(ContentGroup.vk_group_id, String).like(pattern),
                )
            )
        rows, total = await self._paginate(
            stmt,
            page,
            limit,
            *self._group_order(sort_by, sort_order),
        )
        return self._page([self.group_to_dict(row) for row in rows], total, page, limit)

    async def get_group(self, vk_group_id: int) -> dict | None:
        row = await self.session.scalar(
            select(ContentGroup).where(ContentGroup.vk_group_id == vk_group_id)
        )
        return self.group_to_dict(row) if row else None

    async def search_groups(self, query: str, limit: int) -> dict:
        page = await self.list_groups(
            page=1,
            limit=limit,
            search=query,
            sort_by="name",
            sort_order="asc",
        )
        return {"items": page["items"], "total": page["total"], "query": query}

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
        row = await self.session.scalar(
            select(ContentPost).where(ContentPost.external_key == external_key)
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
        return self._page([self.comment_to_dict(row) for row in rows], total, page, limit)

    async def list_authors(
        self,
        offset: int = 0,
        limit: int = 20,
        search: str | None = None,
        city: str | None = None,
        verified: bool | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        stmt = select(ContentAuthor)
        conditions = []
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(ContentAuthor.display_name).like(pattern),
                    cast(ContentAuthor.vk_author_id, String).like(pattern),
                )
            )
        if city:
            conditions.append(false())
        if verified is True:
            conditions.append(false())
        if conditions:
            stmt = stmt.where(and_(*conditions))

        rows, total = await self._offset_paginate(
            stmt,
            offset,
            limit,
            *self._author_order(sort_by, sort_order),
        )
        return {
            "items": [self.author_to_dict(row) for row in rows],
            "total": total,
            "hasMore": offset + limit < total,
        }

    async def get_author(self, vk_author_id: int) -> dict | None:
        row = await self.session.scalar(
            select(ContentAuthor).where(ContentAuthor.vk_author_id == vk_author_id)
        )
        return self.author_to_dict(row) if row else None

    async def list_authors_bulk(self, vk_author_ids: list[int]) -> list[dict]:
        rows = await self.session.scalars(
            select(ContentAuthor).where(ContentAuthor.vk_author_id.in_(vk_author_ids))
        )
        return [self.author_to_dict(row) for row in rows]

    async def list_posts_bulk(self, external_keys: list[str]) -> list[dict]:
        rows = await self.session.scalars(
            select(ContentPost).where(ContentPost.external_key.in_(external_keys))
        )
        return [self.post_to_dict(row) for row in rows]

    async def list_groups_bulk(self, vk_group_ids: list[int]) -> list[dict]:
        rows = await self.session.scalars(
            select(ContentGroup).where(ContentGroup.vk_group_id.in_(vk_group_ids))
        )
        return [self.group_to_dict(row) for row in rows]

    async def _paginate(self, stmt: Select, page: int, limit: int, *order_by) -> tuple[list, int]:
        offset = (page - 1) * limit
        return await self._offset_paginate(stmt, offset, limit, *order_by)

    async def _offset_paginate(
        self,
        stmt: Select,
        offset: int,
        limit: int,
        *order_by,
    ) -> tuple[list, int]:
        total = await self.session.scalar(select(func.count()).select_from(stmt.subquery()))
        result = await self.session.scalars(stmt.order_by(*order_by).offset(offset).limit(limit))
        return list(result), int(total or 0)

    def _page(self, items: list[dict], total: int, page: int, limit: int) -> dict:
        total_pages = ceil(total / limit) if total else 0
        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": total_pages,
            "hasMore": page < total_pages,
        }

    def group_to_dict(self, row: ContentGroup) -> dict:
        return {
            "id": row.id,
            "vkId": row.vk_group_id,
            "vkGroupId": row.vk_group_id,
            "screenName": row.screen_name,
            "name": row.name,
            "isClosed": None,
            "deactivated": None,
            "type": None,
            "photo50": None,
            "photo100": None,
            "photo200": None,
            "activity": None,
            "ageLimits": None,
            "description": None,
            "membersCount": None,
            "status": None,
            "verified": None,
            "wall": None,
            "addresses": None,
            "city": None,
            "counters": None,
            "createdAt": dt(row.updated_at),
            "lastCollectedAt": dt(row.last_collected_at),
            "updatedAt": dt(row.updated_at),
        }

    def author_to_dict(self, row: ContentAuthor) -> dict:
        display_name = row.display_name.strip() if row.display_name else f"VK {row.vk_author_id}"
        first_name, last_name = self._split_display_name(display_name)
        return {
            "id": row.id,
            "vkAuthorId": row.vk_author_id,
            "vkUserId": row.vk_author_id,
            "type": row.type,
            "displayName": row.display_name,
            "firstName": first_name,
            "lastName": last_name,
            "fullName": display_name,
            "photo50": None,
            "photo100": None,
            "photo200": None,
            "domain": None,
            "screenName": None,
            "profileUrl": f"https://vk.com/id{row.vk_author_id}",
            "city": None,
            "country": None,
            "summary": None,
            "photosCount": None,
            "audiosCount": None,
            "videosCount": None,
            "friendsCount": None,
            "followersCount": None,
            "lastSeenAt": None,
            "verifiedAt": dt(row.verified_at),
            "isVerified": bool(row.verified_at),
            "createdAt": dt(row.updated_at),
            "updatedAt": dt(row.updated_at),
        }

    async def _update_author_verified_at(self, vk_author_id: int) -> bool:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        row = await self.session.scalar(
            select(ContentAuthor).where(ContentAuthor.vk_author_id == vk_author_id)
        )
        if not row:
            return False
        row.verified_at = now
        row.updated_at = now
        await self.session.flush()
        return True


    def _group_order(self, sort_by: str | None, sort_order: str):
        direction = sort_order if sort_order in {"asc", "desc"} else "desc"
        fields = {
            "name": ContentGroup.name,
            "screenName": ContentGroup.screen_name,
            "updatedAt": ContentGroup.updated_at,
            "vkId": ContentGroup.vk_group_id,
            "vkGroupId": ContentGroup.vk_group_id,
        }
        field = fields.get(sort_by or "updatedAt", ContentGroup.updated_at)
        primary = (
            field.asc().nulls_last()
            if direction == "asc"
            else field.desc().nulls_last()
        )
        return primary, ContentGroup.id.desc()

    def _author_order(self, sort_by: str | None, sort_order: str):
        direction = sort_order if sort_order in {"asc", "desc"} else "desc"
        fields = {
            "fullName": ContentAuthor.display_name,
            "updatedAt": ContentAuthor.updated_at,
        }
        if sort_by and sort_by not in fields:
            raise ValueError(f"Unsupported author sort field: {sort_by}")
        field = fields.get(sort_by or "updatedAt", ContentAuthor.updated_at)
        primary = (
            field.asc().nulls_last()
            if direction == "asc"
            else field.desc().nulls_last()
        )
        return primary, ContentAuthor.id.desc()

    def _split_display_name(self, display_name: str) -> tuple[str, str]:
        parts = display_name.split()
        if not parts:
            return "", ""
        return parts[0], " ".join(parts[1:])

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
