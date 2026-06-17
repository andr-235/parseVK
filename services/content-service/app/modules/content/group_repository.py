from datetime import datetime, timezone

from sqlalchemy import Select, String, cast, delete, func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentAuthor, ContentComment, ContentGroup, ContentPost
from app.modules.content.base_repository import BaseContentRepository
from app.modules.content.schemas import dt


class GroupRepository(BaseContentRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session)

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
        return self._page(
            [self.group_to_dict(row) for row in rows], total, page, limit
        )

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

    @staticmethod
    def _normalize_group_fields(group: dict) -> dict:
        def val(k_snake: str, k_camel: str):
            return (
                group.get(k_snake)
                if group.get(k_snake) is not None
                else group.get(k_camel)
            )

        return {
            "vk_group_id": int(group["id"]),
            "screen_name": val("screen_name", "screenName"),
            "name": group.get("name"),
            "is_closed": val("is_closed", "isClosed"),
            "deactivated": group.get("deactivated"),
            "type": group.get("type"),
            "photo_50": val("photo_50", "photo50"),
            "photo_100": val("photo_100", "photo100"),
            "photo_200": val("photo_200", "photo200"),
            "activity": group.get("activity"),
            "age_limits": val("age_limits", "ageLimits"),
            "description": group.get("description"),
            "members_count": val("members_count", "membersCount"),
            "status": group.get("status"),
            "verified": group.get("verified"),
            "wall": group.get("wall"),
            "addresses": group.get("addresses"),
            "city": group.get("city"),
            "counters": group.get("counters"),
            "updated_at": datetime.now(timezone.utc),
        }

    async def upsert_group(self, group: dict) -> None:
        data = self._normalize_group_fields(group)
        stmt = insert(ContentGroup).values(**data)
        stmt = stmt.on_conflict_do_update(
            index_elements=[ContentGroup.vk_group_id],
            set_={k: getattr(stmt.excluded, k) for k in data if k != "vk_group_id"},
        )
        await self.session.execute(stmt)

    async def list_groups_bulk(self, vk_group_ids: list[int]) -> list[dict]:
        rows = await self.session.scalars(
            select(ContentGroup).where(
                ContentGroup.vk_group_id.in_(vk_group_ids)
            )
        )
        return [self.group_to_dict(row) for row in rows]

    async def delete_group_and_related(self, vk_group_id: int) -> None:
        await self.session.execute(
            delete(ContentComment).where(
                ContentComment.vk_owner_id == -vk_group_id
            )
        )
        await self.session.execute(
            delete(ContentPost).where(ContentPost.vk_owner_id == -vk_group_id)
        )
        remaining = await self.session.scalar(
            select(func.count()).select_from(
                select(ContentPost.vk_post_id)
                .where(ContentPost.author_vk_id == -vk_group_id)
                .union(
                    select(ContentComment.vk_comment_id).where(
                        ContentComment.author_vk_id == -vk_group_id
                    )
                )
                .subquery()
            )
        )
        if (remaining or 0) == 0:
            await self.session.execute(
                delete(ContentAuthor).where(
                    ContentAuthor.vk_author_id == -vk_group_id
                )
            )
        await self.session.execute(
            delete(ContentGroup).where(ContentGroup.vk_group_id == vk_group_id)
        )
        await self.session.flush()

    def group_to_dict(self, row: ContentGroup) -> dict:
        return {
            "id": row.id,
            "vkId": row.vk_group_id,
            "vkGroupId": row.vk_group_id,
            "screenName": row.screen_name,
            "name": row.name,
            "isClosed": row.is_closed,
            "deactivated": row.deactivated,
            "type": row.type,
            "photo50": row.photo_50,
            "photo100": row.photo_100,
            "photo200": row.photo_200,
            "activity": row.activity,
            "ageLimits": row.age_limits,
            "description": row.description,
            "membersCount": row.members_count,
            "status": row.status,
            "verified": row.verified,
            "wall": row.wall,
            "addresses": row.addresses,
            "city": row.city,
            "counters": row.counters,
            "createdAt": dt(row.updated_at),
            "lastCollectedAt": dt(row.last_collected_at),
            "updatedAt": dt(row.updated_at),
        }

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
