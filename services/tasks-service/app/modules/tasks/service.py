"""Tasks service facade.

Exposes a unified interface over CRUD, execution, and state sub-services
so that routers interact with a single dependency.
"""

import logging

from app.modules.tasks.crud_service import TasksCrudService
from app.modules.tasks.execution_service import TaskExecutionService
from app.modules.tasks.schemas import CreateParseTaskRequest
from app.modules.tasks.state_service import TaskStateService

logger = logging.getLogger(__name__)


class TasksService:
    """Facade over task CRUD, execution, and state services."""

    def __init__(
        self,
        *,
        crud: TasksCrudService,
        execution: TaskExecutionService,
        state: TaskStateService,
    ):
        self.crud = crud
        self.execution = execution
        self.state = state

    async def create_parse_task(
        self,
        owner_user_id: str,
        payload: CreateParseTaskRequest,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("TasksService.create_parse_task called for user=%s", owner_user_id)
        return await self.crud.create_parse_task(owner_user_id, payload, request_id=request_id, correlation_id=correlation_id)

    async def list_tasks(self, owner_user_id: str, page: int, limit: int) -> dict:
        logger.debug("TasksService.list_tasks called for user=%s page=%s", owner_user_id, page)
        return await self.crud.list_tasks(owner_user_id, page, limit)

    async def get_task(self, owner_user_id: str, task_id: int) -> dict | None:
        logger.debug("TasksService.get_task called task_id=%s", task_id)
        return await self.crud.get_task(owner_user_id, task_id)

    async def get_audit_log(self, owner_user_id: str, task_id: int) -> list[dict]:
        logger.debug("TasksService.get_audit_log called task_id=%s", task_id)
        return await self.crud.get_audit_log(owner_user_id, task_id)

    async def start_execution(
        self, task_id: int, payload, request_id: str | None = None, correlation_id: str | None = None
    ) -> dict:
        logger.debug("TasksService.start_execution called task_id=%s", task_id)
        return await self.execution.start_execution(task_id, payload, request_id=request_id, correlation_id=correlation_id)

    async def update_execution_progress(
        self, task_id: int, payload, request_id: str | None = None, correlation_id: str | None = None
    ) -> dict:
        logger.debug("TasksService.update_execution_progress called task_id=%s", task_id)
        return await self.execution.update_execution_progress(task_id, payload, request_id=request_id, correlation_id=correlation_id)

    async def complete_execution(
        self, task_id: int, payload, request_id: str | None = None, correlation_id: str | None = None
    ) -> dict:
        logger.debug("TasksService.complete_execution called task_id=%s", task_id)
        return await self.execution.complete_execution(task_id, payload, request_id=request_id, correlation_id=correlation_id)

    async def fail_execution(
        self, task_id: int, payload, request_id: str | None = None, correlation_id: str | None = None
    ) -> dict:
        logger.debug("TasksService.fail_execution called task_id=%s", task_id)
        return await self.execution.fail_execution(task_id, payload, request_id=request_id, correlation_id=correlation_id)

    async def resume_task(self, owner_user_id: str, task_id: int) -> dict | None:
        logger.debug("TasksService.resume_task called task_id=%s", task_id)
        return await self.state.resume_task(owner_user_id, task_id)

    async def cancel_task(self, owner_user_id: str, task_id: int) -> dict | None:
        logger.debug("TasksService.cancel_task called task_id=%s", task_id)
        return await self.state.cancel_task(owner_user_id, task_id)

    async def check_task(self, owner_user_id: str, task_id: int) -> dict | None:
        logger.debug("TasksService.check_task called task_id=%s", task_id)
        return await self.state.check_task(owner_user_id, task_id)

    async def delete_task(self, owner_user_id: str, task_id: int) -> None:
        logger.debug("TasksService.delete_task called task_id=%s", task_id)
        return await self.state.delete_task(owner_user_id, task_id)
