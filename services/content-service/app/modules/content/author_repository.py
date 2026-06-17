from datetime import UTC, datetime

from sqlalchemy import String, and_, cast, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentAuthor, ContentComment
from app.modules.content.base_repository import BaseContentRepository
from app.modules.content.helpers.author_mappers import (
    author_to_dict,
    get_author_order,
    map_profile_to_author_row,
)


class AuthorRepository(BaseContentRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session)

    async def list_authors(
        self,
        offset: int = 0,
        limit: int = 20,
        search: str | None = None,
        city: str | None = None,
        verified: bool | None = None,
        author_type: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        stmt = select(ContentAuthor)
        conditions = []
        if author_type:
            conditions.append(ContentAuthor.type == author_type)
        if search:
            pattern = f"%{search.lower()}%"
            or_conds = [
                func.lower(ContentAuthor.display_name).like(pattern),
                func.lower(ContentAuthor.first_name).like(pattern),
                func.lower(ContentAuthor.last_name).like(pattern),
                func.lower(ContentAuthor.screen_name).like(pattern),
                func.lower(ContentAuthor.domain).like(pattern),
            ]
            if search.isdigit():
                or_conds.append(
                    cast(ContentAuthor.vk_author_id, String).like(pattern)
                )
            conditions.append(or_(*or_conds))
        if city:
            pattern = f"%{city.lower()}%"
            conditions.append(
                or_(
                    func.lower(ContentAuthor.city["title"].astext).like(pattern),
                    func.lower(ContentAuthor.city["name"].astext).like(pattern),
                    func.lower(cast(ContentAuthor.city, String)).like(pattern),
                )
            )
        if verified is True:
            conditions.append(ContentAuthor.verified_at.isnot(None))
        elif verified is False:
            conditions.append(ContentAuthor.verified_at.is_(None))

        if conditions:
            stmt = stmt.where(and_(*conditions))

        rows, total = await self._offset_paginate(
            stmt,
            offset,
            limit,
            *get_author_order(sort_by, sort_order),
        )
        return {
            "items": [author_to_dict(row) for row in rows],
            "total": total,
            "hasMore": offset + limit < total,
        }

    async def get_author(self, vk_author_id: int) -> dict | None:
        row = await self.session.scalar(
            select(ContentAuthor).where(
                ContentAuthor.vk_author_id == vk_author_id
            )
        )
        return author_to_dict(row) if row else None

    async def list_authors_bulk(
        self, vk_author_ids: list[int]
    ) -> list[dict]:
        rows = await self.session.scalars(
            select(ContentAuthor).where(
                ContentAuthor.vk_author_id.in_(vk_author_ids)
            )
        )
        return [author_to_dict(row) for row in rows]

    async def _update_author_verified_at(self, vk_author_id: int) -> bool:
        now = datetime.now(UTC)
        row = await self.session.scalar(
            select(ContentAuthor).where(
                ContentAuthor.vk_author_id == vk_author_id
            )
        )
        if not row:
            return False
        row.verified_at = now
        row.updated_at = now
        await self.session.flush()
        return True

    async def get_all_author_ids(self) -> list[int]:
        rows = await self.session.scalars(
            select(ContentAuthor.vk_author_id)
        )
        return list(rows.all())

    async def bulk_update_author_profiles(
        self, profiles: list[dict]
    ) -> int:
        now = datetime.now(UTC)
        count = 0
        for p in profiles:
            vk_author_id = int(p["id"])
            row = await self.session.scalar(
                select(ContentAuthor).where(
                    ContentAuthor.vk_author_id == vk_author_id
                )
            )
            if row:
                map_profile_to_author_row(row, p, now)
                count += 1
        await self.session.flush()
        return count

    async def delete_author_and_comments(
        self, vk_author_id: int
    ) -> None:
        await self.session.execute(
            delete(ContentComment).where(
                ContentComment.author_vk_id == vk_author_id
            )
        )
        await self.session.execute(
            delete(ContentAuthor).where(
                ContentAuthor.vk_author_id == vk_author_id
            )
        )
        await self.session.flush()


