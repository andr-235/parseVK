import logging

from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import MonitoringGroup

logger = logging.getLogger(__name__)


class MonitoringGroupsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_by_messenger(
        self, messenger: str | None = None, search: str | None = None,
    ) -> list[MonitoringGroup]:
        stmt = select(MonitoringGroup).order_by(MonitoringGroup.created_at.desc())
        if messenger:
            stmt = stmt.where(MonitoringGroup.messenger == messenger)
        if search:
            stmt = stmt.where(
                MonitoringGroup.name.ilike(f"%{search}%")
                | MonitoringGroup.chat_id.ilike(f"%{search}%")
                | MonitoringGroup.category.ilike(f"%{search}%")
            )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def create(
        self, messenger: str, chat_id: str, name: str, category: str | None = None,
    ) -> MonitoringGroup | None:
        stmt = (
            insert(MonitoringGroup)
            .values(messenger=messenger, chat_id=chat_id, name=name, category=category)
            .on_conflict_do_nothing(
                constraint="uq_monitoring_groups_messenger_chat",
            )
            .returning(MonitoringGroup)
        )
        result = await self.session.execute(stmt)
        row = result.scalar_one_or_none()
        if row:
            logger.info("MonitoringGroup created: id=%d messenger=%s chat_id=%s", row.id, row.messenger, row.chat_id)
        else:
            logger.info("MonitoringGroup duplicate skipped: messenger=%s chat_id=%s", messenger, chat_id)
        return row

    async def get_by_id(self, group_id: int) -> MonitoringGroup | None:
        stmt = select(MonitoringGroup).where(MonitoringGroup.id == group_id)
        result = await self.session.scalars(stmt)
        return result.one_or_none()

    async def update(
        self, group_id: int, name: str | None = None, category: str | None = None,
    ) -> MonitoringGroup | None:
        values = {}
        if name is not None:
            values["name"] = name
        if category is not None:
            values["category"] = category
        if not values:
            return await self.get_by_id(group_id)

        stmt = (
            update(MonitoringGroup)
            .where(MonitoringGroup.id == group_id)
            .values(**values)
            .returning(MonitoringGroup)
        )
        result = await self.session.execute(stmt)
        row = result.scalar_one_or_none()
        if row:
            logger.info("MonitoringGroup updated: id=%d", group_id)
        else:
            logger.info("MonitoringGroup not found for update: id=%d", group_id)
        return row

    async def delete(self, group_id: int) -> bool:
        stmt = delete(MonitoringGroup).where(MonitoringGroup.id == group_id)
        result = await self.session.execute(stmt)
        if result.rowcount > 0:
            logger.info("MonitoringGroup deleted: id=%d", group_id)
            return True
        logger.info("MonitoringGroup not found for deletion: id=%d", group_id)
        return False
