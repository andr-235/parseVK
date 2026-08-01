"""Sources module repository: async CRUD over source/task-source tables.

Identity semantics (issue #283 AC):
- dedupe by (provider, source_type, external_id) via unique constraint;
- task attachment is unique by (task_id, source_id).
Scope/access CRUD lives in ``scope_repository.py``.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import MonitoringSource, TaskSource, utcnow


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

    async def list_sources(self, owner_user_id: str) -> tuple[list[MonitoringSource], int]:
        result = await self.session.scalars(
            select(MonitoringSource)
            .where(MonitoringSource.owner_user_id == owner_user_id)
            .order_by(MonitoringSource.created_at.desc())
        )
        sources = list(result)
        return sources, len(sources)

    async def link_task_source(
        self, task_id: int, source_id: UUID, kind: str = "target"
    ) -> TaskSource | None:
        existing = await self.get_task_source(task_id, source_id)
        if existing is not None:
            return existing
        link = TaskSource(task_id=task_id, source_id=source_id, kind=kind)
        self.session.add(link)
        await self.session.flush()
        await self.session.refresh(link)
        return link

    async def get_task_source(self, task_id: int, source_id: UUID) -> TaskSource | None:
        return await self.session.scalar(
            select(TaskSource).where(
                TaskSource.task_id == task_id, TaskSource.source_id == source_id
            )
        )

    async def list_task_sources(self, task_id: int) -> list[TaskSource]:
        result = await self.session.scalars(
            select(TaskSource)
            .where(TaskSource.task_id == task_id)
            .order_by(TaskSource.created_at.asc())
        )
        return list(result)
