"""Compatibility adapter between legacy ``group_ids`` and ``task_sources``.

While ``source_compat_write_enabled=True``, every legacy group_ids write is
mirrored into normalized task_sources rows (and vice versa on read). When the
flag is off, the legacy path is untouched. Conversion int <-> str happens
here at the boundary: group_ids are ints, external_id is a string.
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import MonitoringSource, Task
from app.modules.sources.repository import SourcesRepository

logger = logging.getLogger(__name__)


class SourceCompatAdapter:
    """Mirrors legacy group_ids into normalized task_sources rows."""

    def __init__(self, session: AsyncSession):
        self.sources_repo = SourcesRepository(session)

    async def write_through(self, task: Task, group_ids: list[int]) -> None:
        if not settings.source_compat_write_enabled:
            logger.debug("Source compat write disabled; skipping adapter sync")
            return
        for group_id in group_ids:
            external_id = str(group_id)
            source = await self.sources_repo.get_source_by_identity("vk", "community", external_id)
            if source is None:
                source = MonitoringSource(
                    owner_user_id=task.owner_user_id,
                    provider="vk",
                    source_type="community",
                    external_id=external_id,
                    owner_id=-group_id,
                )
                source = await self.sources_repo.create_source(source)
                logger.debug(
                    "Compat adapter created source: id=%s external=%s", source.id, external_id
                )
            await self.sources_repo.link_task_source(task.id, source.id)
        logger.debug("Compat adapter synced task sources: task=%s count=%d", task.id, len(group_ids))
