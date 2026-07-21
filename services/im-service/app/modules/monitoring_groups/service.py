import logging
from dataclasses import dataclass

from app.modules.monitoring_groups.repository import MonitoringGroupsRepository

logger = logging.getLogger(__name__)


@dataclass
class MonitoringGroupsService:
    repository: MonitoringGroupsRepository

    async def list_groups(
        self,
        messenger: str | None = None,
        search: str | None = None,
        category: str | None = None,
    ) -> list[dict]:
        rows = await self.repository.list_by_messenger(messenger, search, category)
        return [
            {
                "id": r.id,
                "messenger": r.messenger,
                "chat_id": r.chat_id,
                "name": r.name,
                "category": r.category,
                "im_group_id": r.im_group_id,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            }
            for r in rows
        ]

    async def create_group(
        self, messenger: str, chat_id: str, name: str, category: str | None = None,
        im_group_id: int | None = None,
    ) -> dict | None:
        row = await self.repository.create(messenger, chat_id, name, category, im_group_id)
        if row is None:
            return None
        return {
            "id": row.id,
            "messenger": row.messenger,
            "chat_id": row.chat_id,
            "name": row.name,
            "category": row.category,
            "im_group_id": row.im_group_id,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
        }

    async def update_group(
        self, group_id: int, name: str | None = None, category: str | None = None,
    ) -> dict | None:
        row = await self.repository.update(group_id, name, category)
        if row is None:
            return None
        return {
            "id": row.id,
            "messenger": row.messenger,
            "chat_id": row.chat_id,
            "name": row.name,
            "category": row.category,
            "im_group_id": row.im_group_id,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
        }

    async def delete_group(self, group_id: int) -> bool:
        return await self.repository.delete(group_id)
