import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.monitoring.repository import MonitoringRepository
from app.modules.monitoring.schemas import (
    MonitoringGroupCreate,
    MonitoringGroupResponse,
    MonitoringGroupUpdate,
)

logger = logging.getLogger(__name__)


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
            "lastSyncAt": datetime.now(timezone.utc).isoformat(),
            "page": page,
            "limit": limit,
            "hasMore": has_more,
        }

    async def get_groups(
        self,
        messenger: str | None = None,
        search: str | None = None,
        category: str | None = None,
        sync: bool = False,
    ) -> dict:
        if sync and messenger:
            await self.sync_chats_from_messages(messenger)

        items = await self.repo.get_groups(messenger=messenger, search=search, category=category)
        total = await self.repo.count_groups(messenger=messenger, search=search, category=category)

        return {
            "items": [MonitoringGroupResponse.from_attributes(i) for i in items],
            "total": total,
        }

    async def create_group(self, dto: MonitoringGroupCreate) -> MonitoringGroupResponse:
        group = await self.repo.upsert_group(
            messenger=dto.messenger,
            chat_id=dto.chat_id,
            name=dto.name,
            category=dto.category,
        )
        return MonitoringGroupResponse.from_attributes(group)

    async def update_group(self, id: int, dto: MonitoringGroupUpdate) -> MonitoringGroupResponse:
        update_data = dto.model_dump(exclude_unset=True)
        if not update_data:
            raise ValueError("Нет данных для обновления группы")

        group = await self.repo.get_group_by_id(id)
        if not group:
            raise ValueError(f"Группа с ID {id} не найдена")

        if dto.messenger is not None:
            group.messenger = dto.messenger
        if dto.chat_id is not None:
            group.chat_id = dto.chat_id
        if dto.name is not None:
            group.name = dto.name
        if dto.category is not None:
            group.category = dto.category

        await self.repo.session.flush()
        return MonitoringGroupResponse.from_attributes(group)

    async def delete_group(self, id: int) -> dict:
        success = await self.repo.delete_group(id)
        if not success:
            raise ValueError(f"Группа с ID {id} не найдена")
        return {"success": True, "id": id}

    async def sync_chats_from_messages(self, messenger: str) -> None:
        logger.info("Синхронизация чатов из im_messages для мессенджера: %s", messenger)
        chats = await self.repo.find_distinct_chats()
        filtered = [c for c in chats if c["messenger"] == messenger]
        if not filtered:
            logger.warning("Чаты для %s в im_messages не найдены", messenger)
            return

        synced = 0
        for chat in filtered:
            chat_id = chat["chatId"].strip()
            name = chat["name"].strip()
            if chat_id and name:
                await self.repo.upsert_group(
                    messenger=messenger,
                    chat_id=chat_id,
                    name=name,
                )
                synced += 1

        logger.info("Синхронизация завершена. Добавлено/обновлено групп: %d", synced)
