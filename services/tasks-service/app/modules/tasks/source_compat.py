"""Compatibility and runtime adapters for normalized task sources.

The immutable TaskRun path always requires normalized ``task_sources`` rows.
The legacy compatibility flag now controls only optional mirror behavior; it no
longer decides whether a concrete run receives a source snapshot.
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import MonitoringSource, Task
from app.modules.sources.repository import SourcesRepository
from app.modules.sources.resolver import (
    canonical_external_id,
    canonical_source_id,
)

logger = logging.getLogger(__name__)


class SourceCompatAdapter:
    """Resolve legacy selectors into normalized task-source relations."""

    def __init__(self, session: AsyncSession):
        self.sources_repo = SourcesRepository(session)

    async def ensure_normalized_sources(
        self,
        task: Task,
        group_ids: list[int],
    ) -> None:
        """Freeze the concrete normalized source set for a task.

        ``scope=all`` is resolved here, before TaskRun creation, so execution
        attempts never reread a mutable active-source set.
        """
        if task.scope == "all":
            sources = await self.sources_repo.list_active_sources(
                task.owner_user_id
            )
            if not sources:
                raise RuntimeError(
                    "scope=all cannot be frozen because the owner has no active VK sources"
                )
            for source in sources:
                await self.sources_repo.link_task_source(task.id, source.id)
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
        for group_id in normalized_ids:
            source = await self._ensure_group_source(task, group_id)
            await self.sources_repo.link_task_source(task.id, source.id)
        logger.debug(
            "Resolved selected task sources: task=%s count=%d",
            task.id,
            len(normalized_ids),
        )

    async def write_through(self, task: Task, group_ids: list[int]) -> None:
        """Legacy mirror hook retained for the compatibility window."""
        if not settings.source_compat_write_enabled:
            logger.debug("Source compat mirror disabled; skipping adapter sync")
            return
        await self.ensure_normalized_sources(task, group_ids)

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
