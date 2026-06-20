from datetime import UTC, datetime

from app.domain.monitoring.repositories import MonitoringMessageRepository


class MonitoringMessageService:
    def __init__(self, repository: MonitoringMessageRepository):
        self.repository = repository

    async def list_messages(
        self,
        *,
        keywords: list[str],
        limit: int,
        page: int,
        from_date: datetime | None,
        sources: list[str] | None,
    ) -> dict:
        limit = max(limit, 1)
        page = max(page, 1)
        rows = await self.repository.find_messages(
            keywords=keywords,
            limit=limit + 1,
            offset=(page - 1) * limit,
            from_date=from_date,
            sources=sources,
        )
        has_more = len(rows) > limit
        return {
            "items": rows[:limit],
            "total": min(len(rows), limit),
            "usedKeywords": keywords,
            "lastSyncAt": datetime.now(UTC).isoformat(),
            "page": page,
            "limit": limit,
            "hasMore": has_more,
        }
