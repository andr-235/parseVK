from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models import ImMessage, MonitoringGroup


class MonitoringGroupRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _query(self, **filters):
        query = select(MonitoringGroup)
        if filters.get("messenger"):
            query = query.where(MonitoringGroup.messenger == filters["messenger"])
        if filters.get("category"):
            query = query.where(MonitoringGroup.category.ilike(filters["category"]))
        if filters.get("search"):
            pattern = f"%{filters['search']}%"
            query = query.where(
                MonitoringGroup.name.ilike(pattern)
                | MonitoringGroup.chat_id.ilike(pattern)
                | MonitoringGroup.category.ilike(pattern)
            )
        return query

    async def list_groups(self, **filters) -> list[MonitoringGroup]:
        result = await self.session.execute(
            self._query(**filters).order_by(MonitoringGroup.name.asc())
        )
        return list(result.scalars().all())

    async def count_groups(self, **filters) -> int:
        query = select(func.count()).select_from(self._query(**filters).subquery())
        return int(await self.session.scalar(query) or 0)

    async def get_group(self, group_id: int) -> MonitoringGroup | None:
        return await self.session.scalar(
            select(MonitoringGroup).where(MonitoringGroup.id == group_id)
        )

    async def upsert_group(
        self,
        messenger: str,
        chat_id: str,
        name: str,
        category: str | None = None,
    ) -> MonitoringGroup:
        group = await self.session.scalar(
            select(MonitoringGroup).where(
                MonitoringGroup.messenger == messenger,
                MonitoringGroup.chat_id == chat_id,
            )
        )
        if group is None:
            group = MonitoringGroup(messenger=messenger, chat_id=chat_id, name=name)
            self.session.add(group)
        group.name = name
        if category is not None:
            group.category = category
        await self.session.flush()
        return group

    async def update_group(self, group_id: int, **values) -> MonitoringGroup | None:
        group = await self.get_group(group_id)
        if group is None:
            return None
        for field, value in values.items():
            setattr(group, field, value)
        await self.session.flush()
        return group

    async def delete_group(self, group_id: int) -> bool:
        group = await self.get_group(group_id)
        if group is None:
            return False
        await self.session.delete(group)
        return True


class MonitoringMessageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_messages(
        self,
        keywords: list[str],
        *,
        limit: int,
        offset: int,
        from_date: datetime | None = None,
        sources: list[str] | None = None,
    ) -> list[dict]:
        query = select(ImMessage)
        if keywords:
            query = query.where(or_(*[ImMessage.text.ilike(f"%{word}%") for word in keywords]))
        if from_date:
            query = query.where(ImMessage.created_at >= from_date)
        if sources:
            query = query.where(ImMessage.messenger.in_(sources))
        result = await self.session.execute(
            query.order_by(ImMessage.created_at.desc()).limit(limit).offset(offset)
        )
        return [self._message(row) for row in result.scalars().all()]

    async def find_distinct_chats(self) -> list[dict]:
        query = select(
            ImMessage.messenger,
            ImMessage.chat_external_id,
            ImMessage.chat_name,
        ).distinct()
        rows = await self.session.execute(query)
        return [
            {
                "messenger": row.messenger,
                "chatId": row.chat_external_id,
                "name": row.chat_name or row.chat_external_id,
            }
            for row in rows
        ]

    @staticmethod
    def _message(row: ImMessage) -> dict:
        return {
            "id": str(row.external_id),
            "text": row.text,
            "createdAt": row.created_at.isoformat() if row.created_at else None,
            "author": row.author,
            "chat": row.chat_name,
            "source": row.messenger,
            "contentUrl": row.content_url,
            "contentType": row.content_type,
        }
