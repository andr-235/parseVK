from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tasks.crud_service import TasksCrudService
from app.modules.tasks.schemas import CreateParseTaskRequest


class TasksService:
    def __init__(self, session: AsyncSession):
        svc = self
        self.crud = TasksCrudService(
            session,
            on_complete=lambda **kw: svc._complete_task(**kw),
        )

    async def create_parse_task(
        self,
        owner_user_id: str,
        payload: CreateParseTaskRequest,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        return await self.crud.create_parse_task(owner_user_id, payload, request_id=request_id, correlation_id=correlation_id)

    async def list_tasks(self, owner_user_id: str, page: int, limit: int) -> dict:
        return await self.crud.list_tasks(owner_user_id, page, limit)

    async def get_task(self, owner_user_id: str, task_id: int) -> dict | None:
        return await self.crud.get_task(owner_user_id, task_id)

    async def get_audit_log(self, owner_user_id: str, task_id: int) -> list[dict]:
        return await self.crud.get_audit_log(owner_user_id, task_id)

    async def start_execution(
        self, task_id: int, payload, request_id: str | None = None, correlation_id: str | None = None
    ) -> dict:
        return await self.crud.start_execution(task_id, payload, request_id=request_id, correlation_id=correlation_id)

    async def update_execution_progress(
        self, task_id: int, payload, request_id: str | None = None, correlation_id: str | None = None
    ) -> dict:
        return await self.crud.update_execution_progress(task_id, payload, request_id=request_id, correlation_id=correlation_id)

    async def complete_execution(
        self, task_id: int, payload, request_id: str | None = None, correlation_id: str | None = None
    ) -> dict:
        return await self.crud.complete_execution(task_id, payload, request_id=request_id, correlation_id=correlation_id)

    async def fail_execution(
        self, task_id: int, payload, request_id: str | None = None, correlation_id: str | None = None
    ) -> dict:
        return await self.crud.fail_execution(task_id, payload, request_id=request_id, correlation_id=correlation_id)

    async def resume_task(self, owner_user_id: str, task_id: int) -> dict | None:
        return await self.crud.resume_task(owner_user_id, task_id)

    async def check_task(self, owner_user_id: str, task_id: int) -> dict | None:
        return await self.crud.check_task(owner_user_id, task_id)

    async def cancel_task(self, owner_user_id: str, task_id: int) -> dict | None:
        return await self.crud.cancel_task(owner_user_id, task_id)

    async def delete_task(self, owner_user_id: str, task_id: int) -> None:
        return await self.crud.delete_task(owner_user_id, task_id)

    async def _complete_task(self, **kw):
        pass
