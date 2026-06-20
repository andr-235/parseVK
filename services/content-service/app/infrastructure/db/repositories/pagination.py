from math import ceil

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession


class BaseContentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _paginate(
        self, stmt: Select, page: int, limit: int, *order_by
    ) -> tuple[list, int]:
        offset = (page - 1) * limit
        return await self._offset_paginate(stmt, offset, limit, *order_by)

    async def _offset_paginate(
        self,
        stmt: Select,
        offset: int,
        limit: int,
        *order_by,
    ) -> tuple[list, int]:
        total = await self.session.scalar(
            select(func.count()).select_from(stmt.subquery())
        )
        result = await self.session.scalars(
            stmt.order_by(*order_by).offset(offset).limit(limit)
        )
        return list(result), int(total or 0)

    def _page(
        self, items: list[dict], total: int, page: int, limit: int
    ) -> dict:
        total_pages = ceil(total / limit) if total else 0
        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": total_pages,
            "hasMore": page < total_pages,
        }
