"""Sources service: business rules for sources and task attachments.

External identities are never trusted without resolver validation. Persisted
identity fields come only from the resolver result; request values are lookup
inputs, not authoritative source data.
"""

import logging
from uuid import UUID

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
        resolved = await self.resolver.resolve(identity)

        existing = await self.sources_repo.get_source_by_identity(
            resolved.provider, resolved.source_type, resolved.external_id
        )
        if existing is not None:
            logger.debug("Source already registered: id=%s", existing.id)
            return existing

        source = MonitoringSource(
            id=resolved.source_id,
            owner_user_id=owner_user_id,
            provider=resolved.provider,
            source_type=resolved.source_type,
            external_id=resolved.external_id,
            owner_id=resolved.owner_id,
            display_name=request.display_name,
            revision=resolved.source_revision,
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
            task_id,
            source.id,
            request.kind,
        )
        return source

    async def detach_source_from_task(
        self,
        owner_user_id: str,
        task_id: int,
        source_id: UUID,
    ) -> bool:
        task = await self.tasks_repo.get_task(owner_user_id, task_id)
        if task is None:
            raise TaskNotFoundError(f"Task {task_id} not found")
        detached = await self.sources_repo.unlink_task_source(task_id, source_id)
        logger.info(
            "Task source detached: task=%s source=%s changed=%s",
            task_id,
            source_id,
            detached,
        )
        return detached

    async def list_task_sources(
        self, owner_user_id: str, task_id: int
    ) -> list[MonitoringSource]:
        task = await self.tasks_repo.get_task(owner_user_id, task_id)
        if task is None:
            raise TaskNotFoundError(f"Task {task_id} not found")
        return await self.sources_repo.list_sources_for_task(task_id)
