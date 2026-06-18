import logging

from app.domain.repositories.ingestion import IngestionRepository
from app.services.domain_events_service import OutboxService

logger = logging.getLogger(__name__)


class VkGroupsService:
    def __init__(self, ingestion_repo: IngestionRepository, outbox_service: OutboxService):
        self.ingestion = ingestion_repo
        self.outbox = outbox_service

    async def save_group(self, group_data: dict, correlation_id: str | None = None) -> dict:
        await self.ingestion.upsert_group(group_data, revive_if_deleted=True)
        await self.outbox.emit_group_collected(group_data, correlation_id=correlation_id)
        return group_data

    async def delete_group(self, vk_group_id: int, correlation_id: str | None = None) -> bool:
        success = await self.ingestion.soft_delete_group(vk_group_id)
        if success:
            await self.outbox.emit_group_deleted(vk_group_id, correlation_id=correlation_id)
        return success

    async def delete_all_groups(self, correlation_id: str | None = None) -> list[int]:
        group_ids = await self.ingestion.get_active_group_ids()
        for vk_group_id in group_ids:
            await self.delete_group(vk_group_id, correlation_id=correlation_id)
        return group_ids
