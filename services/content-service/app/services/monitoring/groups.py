import logging

from app.domain.content.errors import EntityNotFoundError
from app.domain.monitoring.repositories import (
    MonitoringGroupRepository,
    MonitoringMessageRepository,
)

logger = logging.getLogger(__name__)


class MonitoringGroupService:
    def __init__(
        self,
        groups: MonitoringGroupRepository,
        messages: MonitoringMessageRepository,
    ):
        self.groups = groups
        self.messages = messages

    async def list_groups(self, **filters) -> dict:
        if filters.pop("sync", False) and filters.get("messenger"):
            await self.sync_chats(filters["messenger"])
        items = await self.groups.list_groups(**filters)
        total = await self.groups.count_groups(**filters)
        return {"items": items, "total": total}

    async def create_group(self, values: dict) -> object:
        return await self.groups.upsert_group(**values)

    async def update_group(self, group_id: int, values: dict) -> object:
        if not values:
            raise ValueError("No group fields supplied")
        if await self.groups.get_group(group_id) is None:
            raise EntityNotFoundError("monitoring_group", group_id)
        updated = await self.groups.update_group(group_id, **values)
        if updated is None:
            raise EntityNotFoundError("monitoring_group", group_id)
        return updated

    async def delete_group(self, group_id: int) -> dict:
        if not await self.groups.delete_group(group_id):
            raise EntityNotFoundError("monitoring_group", group_id)
        return {"success": True, "id": group_id}

    async def sync_chats(self, messenger: str) -> int:
        synced = 0
        for chat in await self.messages.find_distinct_chats():
            if chat["messenger"] != messenger:
                continue
            chat_id = chat["chatId"].strip()
            name = chat["name"].strip()
            if chat_id and name:
                await self.groups.upsert_group(
                    messenger=messenger,
                    chat_id=chat_id,
                    name=name,
                )
                synced += 1
        logger.info("Monitoring chat sync completed: messenger=%s synced=%d", messenger, synced)
        return synced
