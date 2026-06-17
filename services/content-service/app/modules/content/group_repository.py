
from sqlalchemy import String, cast, delete, func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentAuthor, ContentComment, ContentGroup, ContentPost
from app.modules.content.base_repository import BaseContentRepository
from app.modules.content.helpers.group_mappers import (
    get_group_order,
    group_to_dict,
    normalize_group_fields,
)


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
            *get_group_order(sort_by, sort_order),
        )
        return self._page(
            [group_to_dict(row) for row in rows], total, page, limit
        )

    async def get_group(self, vk_group_id: int) -> dict | None:
        row = await self.session.scalar(
            select(ContentGroup).where(ContentGroup.vk_group_id == vk_group_id)
        )
        return group_to_dict(row) if row else None

    async def search_groups(self, query: str, limit: int) -> dict:
        page = await self.list_groups(
            page=1,
            limit=limit,
            search=query,
            sort_by="name",
            sort_order="asc",
        )
        return {"items": page["items"], "total": page["total"], "query": query}

    async def upsert_group(self, group: dict) -> None:
        data = normalize_group_fields(group)
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
        return [group_to_dict(row) for row in rows]

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


