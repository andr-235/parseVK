import logging
from datetime import datetime

from app.db.models import ImMessage, MonitoringGroup
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class MonitoringRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_groups(
        self,
        messenger: str | None = None,
        search: str | None = None,
        category: str | None = None,
    ) -> list[MonitoringGroup]:
        query = select(MonitoringGroup)
        if messenger:
            query = query.where(MonitoringGroup.messenger == messenger)
        if category:
            query = query.where(MonitoringGroup.category.ilike(category))
        if search:
            search_filter = f"%{search}%"
            query = query.where(
                MonitoringGroup.name.ilike(search_filter)
                | MonitoringGroup.chat_id.ilike(search_filter)
                | MonitoringGroup.category.ilike(search_filter)
            )
        query = query.order_by(MonitoringGroup.name.asc())
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_groups(
        self,
        messenger: str | None = None,
        search: str | None = None,
        category: str | None = None,
    ) -> int:
        groups = await self.get_groups(messenger=messenger, search=search, category=category)
        return len(groups)

    async def get_group_by_id(self, id: int) -> MonitoringGroup | None:
        query = select(MonitoringGroup).where(MonitoringGroup.id == id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_group_by_messenger_chat(
        self,
        messenger: str,
        chat_id: str,
    ) -> MonitoringGroup | None:
        query = select(MonitoringGroup).where(
            MonitoringGroup.messenger == messenger,
            MonitoringGroup.chat_id == chat_id,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def upsert_group(
        self,
        messenger: str,
        chat_id: str,
        name: str,
        category: str | None = None,
    ) -> MonitoringGroup:
        group = await self.get_group_by_messenger_chat(messenger, chat_id)
        if group:
            group.name = name
            if category is not None:
                group.category = category
        else:
            group = MonitoringGroup(
                messenger=messenger,
                chat_id=chat_id,
                name=name,
                category=category,
            )
            self.session.add(group)
        await self.session.flush()
        return group

    async def delete_group(self, id: int) -> bool:
        group = await self.get_group_by_id(id)
        if group:
            await self.session.delete(group)
            return True
        return False

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

    async def find_distinct_chats(self) -> list[dict]:
        subq = (
            select(
                ImMessage.messenger,
                ImMessage.chat_external_id,
                ImMessage.chat_name,
            )
            .distinct()
            .subquery()
        )
        query = select(
            subq.c.messenger,
            subq.c.chat_external_id,
            subq.c.chat_name,
        ).order_by(subq.c.chat_name.asc())

        result = await self.session.execute(query)
        return [
            {"messenger": row.messenger, "chatId": row.chat_external_id, "name": row.chat_name or row.chat_external_id}
            for row in result
        ]
