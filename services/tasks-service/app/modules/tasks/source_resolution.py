"""Resolve concrete normalized sources before freezing an immutable TaskRun."""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import MonitoringSource, Task
from app.modules.sources.repository import SourcesRepository
from app.modules.sources.resolver import (
    canonical_external_id,
    canonical_source_id,
)

logger = logging.getLogger(__name__)


class TaskSourceResolver:
    """Resolve a task selector into normalized task-source relations."""

    def __init__(self, session: AsyncSession):
        self.sources_repo = SourcesRepository(session)

    async def resolve(self, task: Task, group_ids: list[int]) -> None:
        if task.scope == "all":
            sources = await self.sources_repo.list_active_sources(
                task.owner_user_id
            )
            if not sources:
                raise RuntimeError(
                    "scope=all cannot be frozen because the owner has no active VK sources"
                )
            await self.sources_repo.sync_task_sources(
                task.id,
                ((source.id, "target") for source in sources),
            )
            logger.debug(
                "Resolved scope=all task sources: task=%s owner=%s count=%d",
                task.id,
                task.owner_user_id,
                len(sources),
            )
            return

        normalized_ids = sorted({int(group_id) for group_id in group_ids})
        if not normalized_ids:
            raise RuntimeError(
                "selected scope cannot be frozen without group identifiers"
            )
        sources = [
            await self._ensure_group_source(task, group_id)
            for group_id in normalized_ids
        ]
        await self.sources_repo.sync_task_sources(
            task.id,
            ((source.id, "target") for source in sources),
        )
        logger.debug(
            "Resolved selected task sources: task=%s count=%d",
            task.id,
            len(normalized_ids),
        )

    async def _ensure_group_source(
        self,
        task: Task,
        group_id: int,
    ) -> MonitoringSource:
        external_id = canonical_external_id(str(group_id))
        source = await self.sources_repo.get_source_by_identity(
            "vk",
            "community",
            external_id,
        )
        if source is not None:
            return source

        source = MonitoringSource(
            id=canonical_source_id("vk", "community", external_id),
            owner_user_id=task.owner_user_id,
            provider="vk",
            source_type="community",
            external_id=external_id,
            owner_id=-int(external_id),
        )
        source = await self.sources_repo.create_source(source)
        logger.debug(
            "Created normalized VK source: id=%s external=%s",
            source.id,
            external_id,
        )
        return source
