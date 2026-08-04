"""Task CRUD service.

Encapsulates creation, listing, retrieval, and audit-log access for parse tasks.
Publishes outbox events when new tasks are created.
"""

import logging
from math import ceil
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskAuditLog
from app.modules.outbox.service import OutboxService
from app.modules.tasks.event_payloads import task_request_payload
from app.modules.tasks.exceptions import TaskNotFoundError
from app.modules.tasks.mapper import audit_to_response, task_to_response
from app.modules.tasks.repository import TasksRepository
from app.modules.tasks.schemas import CreateParseTaskRequest
from app.modules.tasks.source_resolution import TaskSourceResolver
from app.modules.tasks.task_run import TaskRunFreezeError, freeze_task_run
from app.modules.tasks.vk_command import add_vk_execution_command

logger = logging.getLogger(__name__)


class TasksCrudService:
    """CRUD operations for tasks: create, list, get, audit log."""

    def __init__(
        self,
        session: AsyncSession,
        repository: TasksRepository,
        outbox: OutboxService,
        *,
        source_resolver_factory=TaskSourceResolver,
        freezer=freeze_task_run,
        command_publisher=add_vk_execution_command,
    ):
        self.session = session
        self.repository = repository
        self.outbox = outbox
        self.source_resolver_factory = source_resolver_factory
        self.freezer = freezer
        self.command_publisher = command_publisher

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
                execution_run_id=str(uuid4()),
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

        source_resolver = self.source_resolver_factory(self.session)
        try:
            await source_resolver.resolve(task, group_ids)
            run_meta = await self.freezer(self.session, task)
        except (TaskRunFreezeError, RuntimeError) as exc:
            logger.error(
                "TaskRun freeze failed for task_id=%s: %s",
                task.id,
                exc,
                exc_info=True,
            )
            raise

        await self.command_publisher(
            self.session,
            self.outbox,
            task,
            run_meta,
        )
        return task_to_response(task)

    async def list_tasks(
        self,
        owner_user_id: str,
        page: int,
        limit: int,
    ) -> dict:
        tasks, total = await self.repository.list_tasks(
            owner_user_id,
            page=page,
            limit=limit,
        )
        total_pages = ceil(total / limit) if total else 0
        return {
            "tasks": [task_to_response(task) for task in tasks],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": total_pages,
            "hasMore": page < total_pages,
        }

    async def get_task(
        self,
        owner_user_id: str,
        task_id: int,
    ) -> dict | None:
        task = await self.repository.get_task(owner_user_id, task_id)
        return task_to_response(task) if task else None

    async def get_audit_log(
        self,
        owner_user_id: str,
        task_id: int,
    ) -> list[dict]:
        task = await self.repository.get_task(owner_user_id, task_id)
        if not task:
            logger.warning(
                "Task not found for audit log: task_id=%s owner_user_id=%s",
                task_id,
                owner_user_id,
            )
            raise TaskNotFoundError(task_id=task_id)
        rows = await self.repository.list_audit(owner_user_id, task_id)
        return [audit_to_response(row) for row in rows]
