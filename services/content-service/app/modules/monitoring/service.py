from datetime import UTC, datetime

from app.modules.monitoring.repository import MonitoringRepository
from sqlalchemy.ext.asyncio import AsyncSession


class MonitoringService:
    def __init__(self, session: AsyncSession):
        self.repo = MonitoringRepository(session)

    async def get_messages(
        self,
        keywords: list[str] | None = None,
        limit: int = 20,
        page: int = 1,
        from_date: datetime | None = None,
        sources: list[str] | None = None,
    ) -> dict:
        limit = max(limit, 1)
        page = max(page, 1)
        offset = (page - 1) * limit

        active_keywords = keywords or []

        rows = await self.repo.find_messages(
            keywords=active_keywords,
            limit=limit + 1,
            offset=offset,
            from_date=from_date,
            sources=sources,
        )

        has_more = len(rows) > limit
        items = rows[:-1] if has_more else rows

        return {
            "items": items,
            "total": len(items),
            "usedKeywords": active_keywords,
            "lastSyncAt": datetime.now(UTC).isoformat(),
            "page": page,
            "limit": limit,
            "hasMore": has_more,
        }
