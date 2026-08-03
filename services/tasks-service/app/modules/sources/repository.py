"""Sources module repository: async CRUD over source/task-source tables.

MonitoringSource is a globally deduplicated identity. User visibility is
therefore derived from registration or from a task owned by that user, rather
than treating the first registering user as the sole owner forever.
"""

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import exists, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import MonitoringSource, Task, TaskSource, utcnow


class SourcesRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_source(self, source: MonitoringSource) -> MonitoringSource:
        self.session.add(source)
        await self.session.flush()
        await self.session.refresh(source)
        return source

    async def get_source_by_id(self, source_id: UUID) -> MonitoringSource | None:
        return await self.session.get(MonitoringSource, source_id)

    async def get_source_by_identity(
        self, provider: str, source_type: str, external_id: str
    ) -> MonitoringSource | None:
        return await self.session.scalar(
            select(MonitoringSource).where(
                MonitoringSource.provider == provider,
                MonitoringSource.source_type == source_type,
                MonitoringSource.external_id == external_id,
            )
        )

    async def touch_source(self, source: MonitoringSource) -> MonitoringSource:
        source.updated_at = utcnow()
        source.revision += 1
        await self.session.flush()
        return source

    async def list_sources(
        self, owner_user_id: str
    ) -> tuple[list[MonitoringSource], int]:
        linked_to_owner = exists(
            select(1)
            .select_from(TaskSource)
            .join(Task, Task.id == TaskSource.task_id)
            .where(
                TaskSource.source_id == MonitoringSource.id,
                Task.owner_user_id == owner_user_id,
            )
        )
        result = await self.session.scalars(
            select(MonitoringSource)
            .where(
                or_(
                    MonitoringSource.owner_user_id == owner_user_id,
                    linked_to_owner,
                )
            )
            .order_by(MonitoringSource.created_at.desc())
        )
        sources = list(result)
        return sources, len(sources)

    async def list_active_sources(
        self,
        *,
        provider: str = "vk",
        source_type: str = "community",
    ) -> list[MonitoringSource]:
        """Return the concrete active source set used to freeze scope=all."""
        result = await self.session.scalars(
            select(MonitoringSource)
            .where(
                MonitoringSource.provider == provider,
                MonitoringSource.source_type == source_type,
                MonitoringSource.status == "active",
            )
            .order_by(
                MonitoringSource.external_id.asc(),
                MonitoringSource.id.asc(),
            )
        )
        return list(result)

    async def link_task_source(
        self, task_id: int, source_id: UUID, kind: str = "target"
    ) -> TaskSource:
        existing = await self.get_task_source(task_id, source_id)
        if existing is not None:
            return existing
        link = TaskSource(task_id=task_id, source_id=source_id, kind=kind)
        self.session.add(link)
        await self.session.flush()
        await self.session.refresh(link)
        return link

    async def get_task_source(
        self, task_id: int, source_id: UUID
    ) -> TaskSource | None:
        return await self.session.scalar(
            select(TaskSource).where(
                TaskSource.task_id == task_id,
                TaskSource.source_id == source_id,
            )
        )

    async def list_task_sources(self, task_id: int) -> list[TaskSource]:
        result = await self.session.scalars(
            select(TaskSource)
            .where(TaskSource.task_id == task_id)
            .order_by(TaskSource.created_at.asc(), TaskSource.source_id.asc())
        )
        return list(result)

    async def list_sources_for_task(
        self, task_id: int
    ) -> list[MonitoringSource]:
        result = await self.session.scalars(
            select(MonitoringSource)
            .join(TaskSource, TaskSource.source_id == MonitoringSource.id)
            .where(TaskSource.task_id == task_id)
            .order_by(
                MonitoringSource.provider.asc(),
                MonitoringSource.source_type.asc(),
                MonitoringSource.external_id.asc(),
                MonitoringSource.id.asc(),
            )
        )
        return list(result)

    async def list_sources_by_ids(
        self, source_ids: Iterable[UUID]
    ) -> list[MonitoringSource]:
        ids = list(source_ids)
        if not ids:
            return []
        result = await self.session.scalars(
            select(MonitoringSource)
            .where(MonitoringSource.id.in_(ids))
            .order_by(
                MonitoringSource.provider.asc(),
                MonitoringSource.source_type.asc(),
                MonitoringSource.external_id.asc(),
                MonitoringSource.id.asc(),
            )
        )
        return list(result)
