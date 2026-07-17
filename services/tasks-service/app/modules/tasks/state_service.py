"""Task state transition service.

Handles user-facing state changes: resume, cancel, check, and delete.
Validates transitions and publishes outbox events for downstream consumers.
"""

import logging
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import TaskAuditLog
from app.modules.outbox.service import OutboxService
from app.modules.tasks.event_payloads import (
    task_identity_payload,
    task_request_payload,
    task_snapshot,
)
from app.modules.tasks.exceptions import TaskConflictError, TaskNotFoundError
from app.modules.tasks.mapper import task_to_response
from app.modules.tasks.repository import TasksRepository

logger = logging.getLogger(__name__)


class TaskStateService:
    """Handles task state transitions: resume, cancel, check, delete."""

    def __init__(self, session: AsyncSession, repository: TasksRepository, outbox: OutboxService):
        self.session = session
        self.repository = repository
        self.outbox = outbox

    async def resume_task(self, owner_user_id: str, task_id: int) -> dict | None:
        task = await self.repository.get_task_for_update(owner_user_id, task_id)
        if not task:
            return None
        if task.status not in {"failed", "cancelled"}:
            logger.warning(
                "Invalid task transition for resume: task_id=%s status=%s", task_id, task.status
            )
            raise TaskConflictError(
                "Invalid task transition", task_id=task_id, current_status=task.status
            )
        task.status = "pending"
        task.error = None
        task.execution_run_id = str(uuid4())
        await self.repository.add_audit(
            TaskAuditLog(
                owner_user_id=owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.resumed",
                event_data={"taskId": str(task.id), "runId": task.execution_run_id},
            )
        )
        await self.outbox.add_event(
            event_type="task.resumed",
            aggregate_type="task",
            aggregate_id=str(task.id),
            dedupe_key=f"task.resumed:{task.id}:{task.execution_run_id}",
            payload=task_request_payload(task, owner_user_id),
        )
        task = await self.repository.touch_task(task)
        return task_to_response(task)

    async def cancel_task(self, owner_user_id: str, task_id: int) -> dict | None:
        task = await self.repository.get_task_for_update(owner_user_id, task_id)
        if not task:
            return None
        if task.status != "running":
            logger.warning(
                "Can only cancel running tasks: task_id=%s status=%s", task_id, task.status
            )
            raise TaskConflictError(
                "Can only cancel running tasks", task_id=task_id, current_status=task.status
            )
        task.status = "cancelled"
        await self.repository.add_audit(
            TaskAuditLog(
                owner_user_id=owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.cancelled",
                event_data={"taskId": str(task.id), "runId": task.execution_run_id},
            )
        )
        await self.outbox.add_event(
            event_type="task.cancelled",
            aggregate_type="task",
            aggregate_id=str(task.id),
            dedupe_key=f"task.cancelled:{task.id}:{task.execution_run_id}",
            payload=task_identity_payload(task, owner_user_id),
        )
        task = await self.repository.touch_task(task)
        return task_to_response(task)

    async def check_task(self, owner_user_id: str, task_id: int) -> dict | None:
        task = await self.repository.get_task(owner_user_id, task_id)
        if not task:
            return None
        await self.repository.add_audit(
            TaskAuditLog(
                owner_user_id=owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.checked",
                event_data={"taskId": str(task.id)},
            )
        )
        return task_to_response(task)

    async def delete_task(self, owner_user_id: str, task_id: int) -> None:
        task = await self.repository.get_task(owner_user_id, task_id)
        if not task:
            logger.warning("Task not found for delete: task_id=%s", task_id)
            raise TaskNotFoundError(task_id=task_id)
        if task.status == "running":
            logger.warning("Cannot delete running task: task_id=%s", task_id)
            raise TaskConflictError(
                "Cannot delete running task", task_id=task_id, current_status=task.status
            )
        snapshot = task_snapshot(task)
        await self.repository.add_audit(
            TaskAuditLog(
                owner_user_id=owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.deleted",
                event_data={"taskSnapshot": snapshot},
            )
        )
        await self.outbox.add_event(
            event_type="task.deleted",
            aggregate_type="task",
            aggregate_id=str(task.id),
            dedupe_key=f"task.deleted:{task.id}",
            payload={
                "taskId": str(task.id),
                "ownerUserId": owner_user_id,
                "taskSnapshot": snapshot,
            },
        )
        await self.repository.delete_task(task)
