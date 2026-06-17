from datetime import datetime, timezone

from sqlalchemy import Select, String, and_, cast, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentAuthor, ContentComment
from app.modules.content.base_repository import BaseContentRepository
from app.modules.content.schemas import dt


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
            *self._author_order(sort_by, sort_order),
        )
        return {
            "items": [self.author_to_dict(row) for row in rows],
            "total": total,
            "hasMore": offset + limit < total,
        }

    async def get_author(self, vk_author_id: int) -> dict | None:
        row = await self.session.scalar(
            select(ContentAuthor).where(
                ContentAuthor.vk_author_id == vk_author_id
            )
        )
        return self.author_to_dict(row) if row else None

    async def list_authors_bulk(
        self, vk_author_ids: list[int]
    ) -> list[dict]:
        rows = await self.session.scalars(
            select(ContentAuthor).where(
                ContentAuthor.vk_author_id.in_(vk_author_ids)
            )
        )
        return [self.author_to_dict(row) for row in rows]

    async def _update_author_verified_at(self, vk_author_id: int) -> bool:
        now = datetime.now(timezone.utc)
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
        now = datetime.now(timezone.utc)
        count = 0
        for p in profiles:
            vk_author_id = int(p["id"])
            first_name = p.get("first_name", "")
            last_name = p.get("last_name", "")
            display_name = (
                f"{first_name} {last_name}".strip()
                or f"VK {vk_author_id}"
            )

            row = await self.session.scalar(
                select(ContentAuthor).where(
                    ContentAuthor.vk_author_id == vk_author_id
                )
            )
            if row:
                row.display_name = display_name
                row.first_name = first_name
                row.last_name = last_name
                row.photo_50 = p.get("photo_50")
                row.photo_100 = p.get("photo_100")
                row.photo_200 = p.get("photo_200")
                row.domain = p.get("domain")
                row.screen_name = p.get("screen_name")
                row.city = p.get("city")
                row.country = p.get("country")
                row.followers_count = p.get("followers_count")
                row.updated_at = now
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

    def author_to_dict(self, row: ContentAuthor) -> dict:
        display_name = (
            row.display_name.strip()
            if row.display_name
            else f"VK {row.vk_author_id}"
        )
        return {
            "id": row.id,
            "vkAuthorId": row.vk_author_id,
            "vkUserId": row.vk_author_id,
            "type": row.type,
            "displayName": row.display_name,
            "firstName": row.first_name or "",
            "lastName": row.last_name or "",
            "fullName": display_name,
            "photo50": row.photo_50,
            "photo100": row.photo_100,
            "photo200": row.photo_200,
            "domain": row.domain,
            "screenName": row.screen_name,
            "profileUrl": f"https://vk.com/id{row.vk_author_id}",
            "city": row.city,
            "country": row.country,
            "summary": None,
            "photosCount": None,
            "audiosCount": None,
            "videosCount": None,
            "friendsCount": None,
            "followersCount": row.followers_count,
            "lastSeenAt": None,
            "verifiedAt": dt(row.verified_at),
            "isVerified": bool(row.verified_at),
            "createdAt": dt(row.created_at),
            "updatedAt": dt(row.updated_at),
        }

    def _author_order(self, sort_by: str | None, sort_order: str):
        direction = sort_order if sort_order in {"asc", "desc"} else "desc"
        fields = {
            "fullName": ContentAuthor.display_name,
            "firstName": ContentAuthor.first_name,
            "lastName": ContentAuthor.last_name,
            "followersCount": ContentAuthor.followers_count,
            "verifiedAt": ContentAuthor.verified_at,
            "createdAt": ContentAuthor.created_at,
            "created_at": ContentAuthor.created_at,
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

    @staticmethod
    def _split_display_name(display_name: str) -> tuple[str, str]:
        parts = display_name.split()
        if not parts:
            return "", ""
        return parts[0], " ".join(parts[1:])
