from datetime import datetime

from app.db.models import ImMessage
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession


class MonitoringRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_messages(
        self,
        keywords: list[str],
        limit: int,
        offset: int,
        from_date: datetime | None = None,
        sources: list[str] | None = None,
    ) -> list[dict]:
        query = select(ImMessage)

        filters = []
        if keywords:
            keyword_filters = [ImMessage.text.ilike(f"%{kw}%") for kw in keywords]
            filters.append(or_(*keyword_filters))
        if from_date:
            filters.append(ImMessage.created_at >= from_date)
        if sources:
            filters.append(ImMessage.messenger.in_(sources))

        if filters:
            query = query.where(*filters)
        query = query.order_by(ImMessage.created_at.desc()).limit(limit).offset(offset)

        result = await self.session.execute(query)
        rows = []
        for msg in result.scalars().all():
            rows.append({
                "id": str(msg.external_id),
                "text": msg.text,
                "createdAt": msg.created_at.isoformat() if msg.created_at else None,
                "author": msg.author,
                "chat": msg.chat_name,
                "source": msg.messenger,
                "contentUrl": msg.content_url,
                "contentType": msg.content_type,
            })
        return rows
