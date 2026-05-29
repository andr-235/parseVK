import logging
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import VkGroup
from app.modules.ingestion.repository import IngestionRepository
from app.modules.outbox.repository import OutboxRepository
from app.modules.outbox.service import OutboxService

logger = logging.getLogger(__name__)


class VkApiService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.ingestion = IngestionRepository(session)
        self.outbox = OutboxService(OutboxRepository(session))

    async def save_group(self, group_data: dict, correlation_id: str | None = None) -> dict:
        await self.ingestion.upsert_group(group_data)
        await self.outbox.emit_group_collected(group_data, correlation_id=correlation_id)
        return group_data

    async def delete_group(self, vk_group_id: int, correlation_id: str | None = None) -> bool:
        result = await self.session.execute(
            delete(VkGroup).where(VkGroup.vk_group_id == vk_group_id)
        )
        if result.rowcount == 0:
            return False
        await self.outbox.emit_group_deleted(vk_group_id, correlation_id=correlation_id)
        return True

    async def delete_all_groups(self, correlation_id: str | None = None) -> list[int]:
        group_ids = (await self.session.scalars(select(VkGroup.vk_group_id))).all()
        await self.session.execute(delete(VkGroup))
        for vk_group_id in group_ids:
            await self.outbox.emit_group_deleted(vk_group_id, correlation_id=correlation_id)
        return list(group_ids)
