import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskAutomationSettings, utcnow

logger = logging.getLogger(__name__)


class AutomationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_settings(self, owner_user_id: str) -> TaskAutomationSettings:
        settings = await self.session.scalar(
            select(TaskAutomationSettings).where(TaskAutomationSettings.owner_user_id == owner_user_id)
        )
        if settings:
            return settings
        settings = TaskAutomationSettings(owner_user_id=owner_user_id)
        self.session.add(settings)
        await self.session.flush()
        await self.session.refresh(settings)
        return settings

    async def lock_settings(self, owner_user_id: str) -> TaskAutomationSettings:
        settings = await self.get_or_create_settings(owner_user_id)
        locked = await self.session.scalar(
            select(TaskAutomationSettings)
            .where(TaskAutomationSettings.id == settings.id)
            .with_for_update()
        )
        return locked or settings

    async def has_active_automation_task(self, owner_user_id: str) -> bool:
        task = await self.session.scalar(
            select(Task.id).where(
                Task.owner_user_id == owner_user_id,
                Task.source == "automation",
                Task.status.in_(["pending", "running"]),
            )
        )
        return task is not None

    async def find_latest_completed_reusable_task(self, owner_user_id: str) -> Task | None:
        return await self.session.scalar(
            select(Task)
            .where(
                Task.owner_user_id == owner_user_id,
                Task.status == "done",
                Task.mode.is_not(None),
            )
            .where((Task.scope == "all") | ((Task.scope == "selected") & (Task.group_ids != [])))
            .order_by(Task.updated_at.desc(), Task.id.desc())
            .limit(1)
        )

    async def list_enabled_owner_ids(self) -> list[str]:
        """Return owner_user_id list of enabled automation settings."""
        stmt = select(TaskAutomationSettings.owner_user_id).where(
            TaskAutomationSettings.enabled.is_(True)
        )
        result = await self.session.execute(stmt)
        owner_ids = [row[0] for row in result.all()]
        logger.debug("Listed %d enabled owner IDs", len(owner_ids))
        return owner_ids

    async def get_settings_by_owner(self, owner_user_id: str) -> TaskAutomationSettings | None:
        """Load settings for a specific owner. Returns None if not found."""
        stmt = select(TaskAutomationSettings).where(
            TaskAutomationSettings.owner_user_id == owner_user_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_last_run_at(self, settings: TaskAutomationSettings) -> None:
        settings.last_run_at = utcnow()
        settings.updated_at = utcnow()
        await self.session.flush()
