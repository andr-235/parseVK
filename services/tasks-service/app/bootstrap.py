"""Composition root for tasks-service.

Creates service instances with all dependencies wired.
One session per use case — all repositories share the same AsyncSession.
"""

import logging
from collections.abc import Callable
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.outbox.service import OutboxService

if TYPE_CHECKING:
    from app.modules.automation.service import AutomationService
from app.modules.tasks.crud_service import TasksCrudService
from app.modules.tasks.execution_service import TaskExecutionService
from app.modules.tasks.repository import TasksRepository
from app.modules.tasks.service import TasksService
from app.modules.tasks.state_service import TaskStateService

logger = logging.getLogger(__name__)


class ApplicationFactory:
    """Composition root for tasks-service.

    One session per use case — all repositories share the same AsyncSession.
    """

    def __init__(self, session: AsyncSession, on_task_complete: Callable | None = None):
        self.session = session
        self._on_complete = on_task_complete

    def _create_repository(self) -> TasksRepository:
        return TasksRepository(self.session)

    def _create_outbox(self) -> OutboxService:
        return OutboxService(self.session)

    def create_tasks_service(self) -> TasksService:
        repo = self._create_repository()
        outbox = self._create_outbox()
        logger.debug("ApplicationFactory: created TasksService with sub-services")
        return TasksService(
            crud=TasksCrudService(self.session, repo, outbox),
            execution=TaskExecutionService(self.session, repo, outbox, on_complete=self._on_complete),
            state=TaskStateService(self.session, repo, outbox),
        )

    def create_automation_service(self) -> "AutomationService":
        from app.modules.automation.repository import AutomationRepository
        from app.modules.automation.service import AutomationService

        logger.debug("ApplicationFactory: created AutomationService")
        return AutomationService(
            session=self.session,
            repository=AutomationRepository(self.session),
            tasks=TasksRepository(self.session),
            outbox=self._create_outbox(),
        )
