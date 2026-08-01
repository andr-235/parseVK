"""Sources service: business rules for sources and task attachments.

External identities are NEVER trusted without resolver validation
(issue #283 AC). Dedupe by (provider, source_type, external_id).
Access-scope rules live in ``scope_service.py``.
"""

import logging

from app.db.models import MonitoringSource
from app.modules.sources.errors import TaskNotFoundError
from app.modules.sources.identity import canonical_source
from app.modules.sources.repository import SourcesRepository
from app.modules.sources.resolver import SourceIdentity, SourceResolver
from app.modules.sources.schemas import CreateSourceRequest, TaskSourceRequest
from app.modules.tasks.repository import TasksRepository

logger = logging.getLogger(__name__)


class SourcesService:
    def __init__(
        self,
        session,
        resolver: SourceResolver,
        sources_repo: SourcesRepository | None = None,
        tasks_repo: TasksRepository | None = None,
    ):
        self.session = session
        self.resolver = resolver
        self.sources_repo = sources_repo or SourcesRepository(session)
        self.tasks_repo = tasks_repo or TasksRepository(session)

    async def create_source(
        self, owner_user_id: str, request: CreateSourceRequest
    ) -> MonitoringSource:
        identity = SourceIdentity(request.provider, request.source_type, request.external_id)
        await canonical_source(self.resolver, self.sources_repo, identity)

        existing = await self.sources_repo.get_source_by_identity(
            request.provider, request.source_type, request.external_id
        )
        if existing is not None:
            logger.debug("Source already registered: id=%s", existing.id)
            return existing

        source = MonitoringSource(
            owner_user_id=owner_user_id,
            provider=request.provider,
            source_type=request.source_type,
            external_id=request.external_id,
            owner_id=-int(request.external_id),
            display_name=request.display_name,
        )
        source = await self.sources_repo.create_source(source)
        logger.info("Source registered: id=%s external=%s", source.id, source.external_id)
        return source

    async def list_sources(self, owner_user_id: str) -> tuple[list[MonitoringSource], int]:
        return await self.sources_repo.list_sources(owner_user_id)

    async def attach_source_to_task(
        self, owner_user_id: str, task_id: int, request: TaskSourceRequest
    ) -> MonitoringSource:
        task = await self.tasks_repo.get_task(owner_user_id, task_id)
        if task is None:
            raise TaskNotFoundError(f"Task {task_id} not found")
        identity = SourceIdentity(request.provider, request.source_type, request.external_id)
        source = await canonical_source(self.resolver, self.sources_repo, identity)
        await self.sources_repo.link_task_source(task_id, source.id, request.kind)
        logger.info(
            "Task source attached: task=%s source=%s kind=%s",
            task_id, source.id, request.kind,
        )
        return source

    async def list_task_sources(self, owner_user_id: str, task_id: int) -> list[MonitoringSource]:
        task = await self.tasks_repo.get_task(owner_user_id, task_id)
        if task is None:
            raise TaskNotFoundError(f"Task {task_id} not found")
        links = await self.sources_repo.list_task_sources(task_id)
        return [
            source
            for link in links
            if (source := await self.sources_repo.get_source_by_id(link.source_id))
        ]
