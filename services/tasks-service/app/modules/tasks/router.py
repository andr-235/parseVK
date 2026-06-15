from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_internal_token, require_owner_user_id
from app.db.session import get_session
from app.modules.tasks.schemas import (
    CreateParseTaskRequest,
    ExecutionCompleteRequest,
    ExecutionFailRequest,
    ExecutionProgressRequest,
    ExecutionStartRequest,
)
from app.modules.tasks.service import TasksService

router = APIRouter(
    prefix="/internal/tasks",
    tags=["tasks"],
    dependencies=[Depends(require_internal_token)],
)


async def get_tasks_service(session: AsyncSession = Depends(get_session)) -> TasksService:
    return TasksService(session)


@router.post("/parse")
async def create_parse_task(
    payload: CreateParseTaskRequest,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: TasksService = Depends(get_tasks_service),
    x_request_id: str | None = Header(default=None, alias="X-Request-ID"),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    return await service.create_parse_task(
        owner_user_id, payload, request_id=x_request_id, correlation_id=x_correlation_id
    )


@router.get("")
async def list_tasks(
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    service: TasksService = Depends(get_tasks_service),
):
    return await service.list_tasks(owner_user_id, page, limit)


@router.post("/{task_id}/execution/start")
async def start_execution(
    task_id: int,
    payload: ExecutionStartRequest,
    service: TasksService = Depends(get_tasks_service),
    x_request_id: str | None = Header(default=None, alias="X-Request-ID"),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    return await service.start_execution(task_id, payload, request_id=x_request_id, correlation_id=x_correlation_id)


@router.post("/{task_id}/execution/progress")
async def update_execution_progress(
    task_id: int,
    payload: ExecutionProgressRequest,
    service: TasksService = Depends(get_tasks_service),
    x_request_id: str | None = Header(default=None, alias="X-Request-ID"),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    return await service.update_execution_progress(
        task_id, payload, request_id=x_request_id, correlation_id=x_correlation_id
    )


@router.post("/{task_id}/execution/complete")
async def complete_execution(
    task_id: int,
    payload: ExecutionCompleteRequest,
    service: TasksService = Depends(get_tasks_service),
    x_request_id: str | None = Header(default=None, alias="X-Request-ID"),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    return await service.complete_execution(task_id, payload, request_id=x_request_id, correlation_id=x_correlation_id)


@router.post("/{task_id}/execution/fail")
async def fail_execution(
    task_id: int,
    payload: ExecutionFailRequest,
    service: TasksService = Depends(get_tasks_service),
    x_request_id: str | None = Header(default=None, alias="X-Request-ID"),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    return await service.fail_execution(task_id, payload, request_id=x_request_id, correlation_id=x_correlation_id)


@router.get("/{task_id}")
async def get_task(
    task_id: int,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: TasksService = Depends(get_tasks_service),
):
    task = await service.get_task(owner_user_id, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.get("/{task_id}/audit-log")
async def get_task_audit_log(
    task_id: int,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: TasksService = Depends(get_tasks_service),
):
    return await service.get_audit_log(owner_user_id, task_id)


@router.post("/{task_id}/resume")
async def resume_task(
    task_id: int,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: TasksService = Depends(get_tasks_service),
):
    task = await service.resume_task(owner_user_id, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.post("/{task_id}/check")
async def check_task(
    task_id: int,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: TasksService = Depends(get_tasks_service),
):
    task = await service.check_task(owner_user_id, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: TasksService = Depends(get_tasks_service),
):
    await service.delete_task(owner_user_id, task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
