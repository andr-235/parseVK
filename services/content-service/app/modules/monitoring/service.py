import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import monitor_engine
from app.modules.monitoring.repository import MonitoringRepository
from app.modules.monitoring.schemas import (
    MonitoringGroupCreate,
    MonitoringGroupUpdate,
    MonitoringGroupResponse,
)

logger = logging.getLogger(__name__)


class MonitoringService:
    def __init__(self, session: AsyncSession):
        self.repo = MonitoringRepository(session, cfg=settings, mon_engine=monitor_engine)

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

        # Если ключевые слова не переданы, пытаемся взять дефолтные из внешней БД
        active_keywords = keywords or []
        if not active_keywords:
            external_keywords = await self.repo.find_external_keywords()
            if external_keywords:
                active_keywords = external_keywords

        if not active_keywords:
            return {
                "items": [],
                "total": 0,
                "usedKeywords": [],
                "lastSyncAt": datetime.now(timezone.utc).isoformat(),
                "page": page,
                "limit": limit,
                "hasMore": False,
            }

        # Получаем на 1 элемент больше, чтобы понять, есть ли еще страницы
        rows = await self.repo.find_external_messages(
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
            await self.sync_external_groups(messenger)

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

    async def sync_external_groups(self, messenger: str) -> None:
        logger.info(f"Запуск синхронизации внешних групп для мессенджера: {messenger}")
        sources = ["messages"] if messenger == "whatsapp" else ["messages_max"] if messenger == "max" else None
        
        external_groups = await self.repo.find_external_groups(sources=sources)
        if not external_groups:
            logger.warning(f"Внешние группы для {messenger} не найдены.")
            return

        synced = 0
        for group in external_groups:
            chat_id = group["chatId"].strip()
            name = group["name"].strip()
            if chat_id and name:
                await self.repo.upsert_group(
                    messenger=messenger,
                    chat_id=chat_id,
                    name=name,
                )
                synced += 1

        logger.info(f"Синхронизация завершена. Успешно синхронизировано групп: {synced}")
