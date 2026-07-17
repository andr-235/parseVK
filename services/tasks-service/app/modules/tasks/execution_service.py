"""Task execution lifecycle service.

Coordinates start, progress, completion, and failure of parse tasks.
Publishes outbox events for completed and failed executions and writes
audit logs for each lifecycle transition.
"""

import logging
from collections.abc import Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import TaskAuditLog
from app.modules.outbox.service import OutboxService
from app.modules.tasks.exceptions import TaskConflictError, TaskNotFoundError
from app.modules.tasks.mapper import task_to_response
from app.modules.tasks.repository import TasksRepository

logger = logging.getLogger(__name__)


class TaskExecutionService:
    """Handles task execution lifecycle: start, progress, complete, fail."""
    def __init__(
        self, session: AsyncSession, repository: TasksRepository, outbox: OutboxService,
        on_complete: Callable | None = None,
    ):
        self.session = session
        self.repository = repository
        self.outbox = outbox
        self._on_complete = on_complete
    async def start_execution(self, task_id: int, payload, request_id: str | None = None,
                              correlation_id: str | None = None) -> dict:
        logger.debug("Execution lifecycle: start_execution for task %s", task_id)
        task = await self.repository.get_task_by_id_for_update(task_id)
        if not task:
            logger.warning("Task not found for start_execution: task_id=%s", task_id)
            raise TaskNotFoundError(task_id=task_id)
        run_id = str(payload.run_id)
        if task.status == "running":
            if task.execution_run_id == run_id:
                return task_to_response(task)
            logger.warning("Task already running: task_id=%s run_id=%s", task_id, run_id)
            raise TaskConflictError("Task already running", task_id=task_id, current_status="running")
        if task.status == "done":
            if task.execution_run_id == run_id:
                return task_to_response(task)
            logger.warning("Task already completed: task_id=%s", task_id)
            raise TaskConflictError("Task already completed", task_id=task_id, current_status="done")
        task.execution_run_id = run_id
        task.status = "running"
        task.error = None
        await self.repository.add_audit(TaskAuditLog(
            owner_user_id=task.owner_user_id, aggregate_type="task", aggregate_id=str(task.id),
            task_id=task.id, event_type="task.execution_started",
            event_data={"taskId": str(task.id), "runId": run_id, "worker": payload.worker},
        ))
        task = await self.repository.touch_task(task)
        return task_to_response(task)
    async def update_execution_progress(self, task_id: int, payload, request_id: str | None = None,
                                        correlation_id: str | None = None) -> dict:
        logger.debug("Execution lifecycle: update_execution_progress for task %s", task_id)
        task = await self.repository.get_task_by_id_for_update(task_id)
        if not task:
            logger.warning("Task not found for update_execution_progress: task_id=%s", task_id)
            raise TaskNotFoundError(task_id=task_id)
        run_id = str(payload.run_id)
        if task.status != "running":
            logger.warning("Task is not running: task_id=%s status=%s", task_id, task.status)
            raise TaskConflictError("Task is not running", task_id=task_id, current_status=task.status)
        if task.execution_run_id != run_id:
            logger.warning("Execution run mismatch: task_id=%s expected=%s got=%s", task_id, task.execution_run_id, run_id)
            raise TaskConflictError("Execution run mismatch", task_id=task_id)
        task.processed_items, task.total_items, task.progress, task.stats = (
            payload.processed_items, payload.total_items, payload.progress, payload.stats
        )
        task = await self.repository.touch_task(task)
        return task_to_response(task)
    async def complete_execution(self, task_id: int, payload, request_id: str | None = None,
                                  correlation_id: str | None = None) -> dict:
        logger.debug("Execution lifecycle: complete_execution for task %s", task_id)
        task = await self.repository.get_task_by_id_for_update(task_id)
        if not task:
            logger.warning("Task not found for complete_execution: task_id=%s", task_id)
            raise TaskNotFoundError(task_id=task_id)
        run_id = str(payload.run_id)
        if task.status == "done" and task.execution_run_id == run_id:
            return task_to_response(task)
        if task.status != "running":
            logger.warning("Task is not running for complete_execution: task_id=%s status=%s", task_id, task.status)
            raise TaskConflictError("Task is not running", task_id=task_id, current_status=task.status)
        if task.execution_run_id != run_id:
            logger.warning("Execution run mismatch at complete: task_id=%s expected=%s got=%s", task_id, task.execution_run_id, run_id)
            raise TaskConflictError("Execution run mismatch", task_id=task_id)
        task.status = "done"
        task.processed_items, task.total_items, task.progress, task.stats = (
            payload.processed_items, payload.total_items, 1, payload.stats
        )
        await self.repository.add_audit(TaskAuditLog(
            owner_user_id=task.owner_user_id, aggregate_type="task", aggregate_id=str(task.id),
            task_id=task.id, event_type="task.completed",
            event_data={"taskId": str(task.id)},
        ))
        await self.outbox.add_event(
            event_type="task.completed", aggregate_type="task", aggregate_id=str(task.id),
            correlation_id=correlation_id, dedupe_key=f"task.completed:{task.id}",
            payload={
                "taskId": str(task.id), "ownerUserId": task.owner_user_id, "scope": task.scope,
                "mode": task.mode, "groupIds": task.group_ids, "postLimit": task.post_limit,
                "source": task.source, "stats": task.stats,
                "processedItems": task.processed_items, "totalItems": task.total_items,
            },
        )
        logger.info("Published task.completed outbox event for task %s", task.id)
        task = await self.repository.touch_task(task)
        if self._on_complete:
            await self._on_complete(task_id=task_id, task=task)
        return task_to_response(task)
    async def fail_execution(self, task_id: int, payload, request_id: str | None = None,
                             correlation_id: str | None = None) -> dict:
        logger.debug("Execution lifecycle: fail_execution for task %s", task_id)
        task = await self.repository.get_task_by_id_for_update(task_id)
        if not task:
            logger.warning("Task not found for fail_execution: task_id=%s", task_id)
            raise TaskNotFoundError(task_id=task_id)
        run_id = str(payload.run_id)
        if task.status == "failed" and task.execution_run_id == run_id:
            return task_to_response(task)
        if task.execution_run_id and task.execution_run_id != run_id:
            logger.warning("Execution run mismatch at fail: task_id=%s expected=%s got=%s", task_id, task.execution_run_id, run_id)
            raise TaskConflictError("Execution run mismatch", task_id=task_id)
        task.execution_run_id, task.status, task.error, task.processed_items, task.total_items = (
            run_id, "failed", payload.error, payload.processed_items, payload.total_items
        )
        task.progress = task.processed_items / task.total_items if task.total_items else 0
        task.stats = payload.stats
        await self.repository.add_audit(TaskAuditLog(
            owner_user_id=task.owner_user_id, aggregate_type="task", aggregate_id=str(task.id),
            task_id=task.id, event_type="task.failed",
            event_data={"taskId": str(task.id), "error": payload.error},
        ))
        await self.outbox.add_event(
            event_type="task.failed", aggregate_type="task", aggregate_id=str(task.id),
            correlation_id=correlation_id, dedupe_key=f"task.failed:{task.id}:{run_id}",
            payload={
                "taskId": str(task.id), "ownerUserId": task.owner_user_id,
                "error": payload.error, "scope": task.scope, "mode": task.mode,
                "groupIds": task.group_ids, "postLimit": task.post_limit,
                "source": task.source,
            },
        )
        logger.info("Published task.failed outbox event for task %s", task.id)
        task = await self.repository.touch_task(task)
        return task_to_response(task)
