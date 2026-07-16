import logging
from math import ceil

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskAuditLog
from app.modules.outbox.service import OutboxService
from app.modules.tasks.mapper import audit_to_response, task_to_response
from app.modules.tasks.repository import TasksRepository
from app.modules.tasks.schemas import CreateParseTaskRequest

logger = logging.getLogger(__name__)

class TasksCrudService:
    def __init__(self, session: AsyncSession, on_complete=None):
        self.repository = TasksRepository(session)
        self.outbox = OutboxService(session)
        self._on_complete = on_complete

    async def create_parse_task(
        self,
        owner_user_id: str,
        payload: CreateParseTaskRequest,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        group_ids = [] if payload.scope == "all" else payload.group_ids
        title = f"VK parse: {payload.scope} / {payload.mode}"
        description = {
            "scope": payload.scope,
            "mode": payload.mode,
            "groupIds": group_ids,
            "postLimit": payload.post_limit,
        }
        task = await self.repository.create_task(
            Task(
                owner_user_id=owner_user_id,
                title=title,
                description=description,
                status="pending",
                scope=payload.scope,
                mode=payload.mode,
                group_ids=group_ids,
                post_limit=payload.post_limit,
                source="manual",
            )
        )
        await self.repository.add_audit(
            TaskAuditLog(
                owner_user_id=owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.created",
                event_data={"taskId": str(task.id), "source": "manual"},
            )
        )
        await self.outbox.add_event(
            event_type="task.created",
            aggregate_type="task",
            aggregate_id=str(task.id),
            correlation_id=correlation_id,
            dedupe_key=f"task.created:{task.id}",
            payload={
                "taskId": str(task.id),
                "ownerUserId": owner_user_id,
                "scope": task.scope,
                "mode": task.mode,
                "groupIds": task.group_ids,
                "postLimit": task.post_limit,
                "source": task.source,
            },
        )
        return task_to_response(task)

    async def list_tasks(self, owner_user_id: str, page: int, limit: int) -> dict:
        tasks, total = await self.repository.list_tasks(owner_user_id, page=page, limit=limit)
        total_pages = ceil(total / limit) if total else 0
        return {
            "tasks": [task_to_response(task) for task in tasks],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": total_pages,
            "hasMore": page < total_pages,
        }

    async def get_task(self, owner_user_id: str, task_id: int) -> dict | None:
        task = await self.repository.get_task(owner_user_id, task_id)
        return task_to_response(task) if task else None

    async def get_audit_log(self, owner_user_id: str, task_id: int) -> list[dict]:
        task = await self.repository.get_task(owner_user_id, task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        rows = await self.repository.list_audit(owner_user_id, task_id)
        return [audit_to_response(row) for row in rows]

    async def start_execution(
        self, task_id: int, payload, request_id: str | None = None, correlation_id: str | None = None
    ) -> dict:
        task = await self.repository.get_task_by_id(task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        run_id = str(payload.run_id)
        if task.status == "running":
            if task.execution_run_id == run_id:
                return task_to_response(task)
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Task already running")
        if task.status == "done":
            if task.execution_run_id == run_id:
                return task_to_response(task)
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Task already completed")
        task.execution_run_id = run_id
        task.status = "running"
        task.error = None
        await self.repository.add_audit(
            TaskAuditLog(
                owner_user_id=task.owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.execution_started",
                event_data={"taskId": str(task.id), "runId": run_id, "worker": payload.worker},
            )
        )
        task = await self.repository.touch_task(task)
        return task_to_response(task)

    async def update_execution_progress(
        self, task_id: int, payload, request_id: str | None = None, correlation_id: str | None = None
    ) -> dict:
        task = await self.repository.get_task_by_id(task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        run_id = str(payload.run_id)
        if task.status != "running":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Task is not running")
        if task.execution_run_id != run_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Execution run mismatch")
        task.processed_items = payload.processed_items
        task.total_items = payload.total_items
        task.progress = payload.progress
        task.stats = payload.stats
        task = await self.repository.touch_task(task)
        return task_to_response(task)

    async def complete_execution(
        self, task_id: int, payload, request_id: str | None = None, correlation_id: str | None = None
    ) -> dict:
        task = await self.repository.get_task_by_id(task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        run_id = str(payload.run_id)
        if task.status == "done" and task.execution_run_id == run_id:
            return task_to_response(task)
        if task.status != "running":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Task is not running")
        if task.execution_run_id != run_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Execution run mismatch")
        task.status = "done"
        task.processed_items = payload.processed_items
        task.total_items = payload.total_items
        task.progress = 1
        task.stats = payload.stats
        await self.repository.add_audit(
            TaskAuditLog(
                owner_user_id=task.owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.completed",
                event_data={"taskId": str(task.id)},
            )
        )
        await self.outbox.add_event(
            event_type="task.completed",
            aggregate_type="task",
            aggregate_id=str(task.id),
            correlation_id=correlation_id,
            dedupe_key=f"task.completed:{task.id}",
            payload={
                "taskId": str(task.id),
                "ownerUserId": task.owner_user_id,
                "scope": task.scope,
                "mode": task.mode,
                "groupIds": task.group_ids,
                "postLimit": task.post_limit,
                "source": task.source,
                "stats": task.stats,
                "processedItems": task.processed_items,
                "totalItems": task.total_items,
            },
        )
        logger.info("Published task.completed outbox event for task %s", task.id)
        task = await self.repository.touch_task(task)
        if self._on_complete:
            await self._on_complete(task_id=task_id, task=task)
        return task_to_response(task)

    async def fail_execution(
        self, task_id: int, payload, request_id: str | None = None, correlation_id: str | None = None
    ) -> dict:
        task = await self.repository.get_task_by_id(task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        run_id = str(payload.run_id)
        if task.status == "failed" and task.execution_run_id == run_id:
            return task_to_response(task)
        if task.execution_run_id and task.execution_run_id != run_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Execution run mismatch")
        task.execution_run_id = run_id
        task.status = "failed"
        task.error = payload.error
        task.processed_items = payload.processed_items
        task.total_items = payload.total_items
        task.progress = task.processed_items / task.total_items if task.total_items else 0
        task.stats = payload.stats
        await self.repository.add_audit(
            TaskAuditLog(
                owner_user_id=task.owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.failed",
                event_data={"taskId": str(task.id), "error": payload.error},
            )
        )
        await self.outbox.add_event(
            event_type="task.failed",
            aggregate_type="task",
            aggregate_id=str(task.id),
            correlation_id=correlation_id,
            dedupe_key=f"task.failed:{task.id}:{run_id}",
            payload={
                "taskId": str(task.id),
                "ownerUserId": task.owner_user_id,
                "error": payload.error,
                "scope": task.scope,
                "mode": task.mode,
                "groupIds": task.group_ids,
                "postLimit": task.post_limit,
                "source": task.source,
            },
        )
        logger.info("Published task.failed outbox event for task %s", task.id)
        task = await self.repository.touch_task(task)
        return task_to_response(task)

    async def resume_task(self, owner_user_id: str, task_id: int) -> dict | None:
        task = await self.repository.get_task(owner_user_id, task_id)
        if not task:
            return None
        if task.status in {"running", "done"}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invalid task transition")
        task.status = "pending"
        task.error = None
        await self.repository.add_audit(
            TaskAuditLog(
                owner_user_id=owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.resumed",
                event_data={"taskId": str(task.id)},
            )
        )
        await self.outbox.add_event(
            event_type="task.resumed",
            aggregate_type="task",
            aggregate_id=str(task.id),
            dedupe_key=f"task.resumed:{task.id}",
            payload={
                "taskId": str(task.id),
                "ownerUserId": owner_user_id,
                "scope": task.scope,
                "mode": task.mode,
                "groupIds": task.group_ids,
                "postLimit": task.post_limit,
                "source": task.source,
            },
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

    async def cancel_task(self, owner_user_id: str, task_id: int) -> dict | None:
        task = await self.repository.get_task(owner_user_id, task_id)
        if not task:
            return None
        if task.status != "running":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Can only cancel running tasks",
            )
        task.status = "cancelled"
        await self.repository.add_audit(
            TaskAuditLog(
                owner_user_id=owner_user_id,
                aggregate_type="task",
                aggregate_id=str(task.id),
                task_id=task.id,
                event_type="task.cancelled",
                event_data={"taskId": str(task.id)},
            )
        )
        await self.outbox.add_event(
            event_type="task.cancelled",
            aggregate_type="task",
            aggregate_id=str(task.id),
            dedupe_key=f"task.cancelled:{task.id}",
            payload={
                "taskId": str(task.id),
                "ownerUserId": owner_user_id,
            },
        )
        task = await self.repository.touch_task(task)
        return task_to_response(task)

    async def delete_task(self, owner_user_id: str, task_id: int) -> None:
        task = await self.repository.get_task(owner_user_id, task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        if task.status == "running":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete running task")
        snapshot = {
            "taskId": str(task.id),
            "status": task.status,
            "scope": task.scope,
            "mode": task.mode,
            "groupIds": task.group_ids,
            "postLimit": task.post_limit,
        }
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
            payload={"taskId": str(task.id), "ownerUserId": owner_user_id, "taskSnapshot": snapshot},
        )
        await self.repository.delete_task(task)
