import logging
from datetime import UTC, datetime

import httpx

from app.domain.events.task_event_mapper import TaskEventMapper
from common.events import TaskEvent
from app.domain.entities.tasks import VkTaskRun
from app.domain.repositories.tasks import TaskEventsRepository
from app.infrastructure.tasks_client.client import TasksClient

CONSUMER_NAME = "vk-service.tasks"
logger = logging.getLogger("vk-service.tasks")


def utcnow() -> datetime:
    return datetime.now(UTC)


class TaskEventsService:
    def __init__(
        self,
        repository: TaskEventsRepository,
        tasks_client: TasksClient,
        *,
        consumer_name: str = CONSUMER_NAME,
    ):
        self.repository = repository
        self.tasks_client = tasks_client
        self.consumer_name = consumer_name

    async def handle(self, event: TaskEvent) -> VkTaskRun | None:
        if await self.repository.is_processed(self.consumer_name, event.event_id):
            return None

        if event.event_type in {"task.deleted", "task.cancelled", "task.failed"}:
            result = await self._handle_termination(event)
        else:
            result = await self._handle_created_or_resumed(event)

        await self.repository.mark_processed(self.consumer_name, event.event_id, event.event_type)
        await self.repository.save()
        return result

    async def _handle_created_or_resumed(self, event: TaskEvent) -> VkTaskRun | None:
        task_id = TaskEventMapper.get_task_id(event)
        run_id = str(event.event_id)
        task_run = await self.repository.get_task_run(task_id)

        if task_run is not None:
            if task_run.status == "done":
                return None
            if task_run.status == "running":
                return None
            task_run = await self.repository.update_task_run(
                task_id, run_id=run_id, updated_at=utcnow()
            )
        else:
            task_run = await self.repository.create_task_run(
                task_id=task_id,
                owner_user_id=TaskEventMapper.get_owner_user_id(event),
                run_id=run_id,
                scope=TaskEventMapper.get_scope(event),
                mode=TaskEventMapper.get_mode(event),
                group_ids=TaskEventMapper.get_group_ids(event),
                post_limit=TaskEventMapper.get_post_limit(event),
            )

        try:
            await self.tasks_client.start_execution(
                task_id,
                run_id,
                request_id=run_id,
                correlation_id=event.correlation_id,
            )
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 409:
                await self._handle_conflict(task_run, run_id, exc)
                return None
            if exc.response.status_code == 404:
                logger.warning(
                    "[FIX] Task %s not found in tasks-service (may have been deleted), skipping",
                    task_id,
                )
                await self.repository.update_task_run(
                    task_id,
                    status="failed",
                    finished_at=utcnow(),
                    last_error=f"Task {task_id} not found in tasks-service",
                    updated_at=utcnow(),
                )
                return None
            raise

        await self.repository.update_task_run(
            task_id,
            status="running",
            started_at=task_run.started_at or utcnow(),
            updated_at=utcnow(),
        )
        task_run = await self.repository.get_task_run(task_id)
        return task_run

    async def _handle_termination(self, event: TaskEvent) -> VkTaskRun | None:
        task_id = TaskEventMapper.get_task_id(event)
        task_run = await self.repository.get_task_run(task_id)
        if task_run is None:
            return None

        new_status = "failed" if event.event_type == "task.failed" else "cancelled"
        task_run = await self.repository.update_task_run(
            task_id,
            status=new_status,
            finished_at=utcnow(),
            updated_at=utcnow(),
        )
        return task_run

    async def _handle_conflict(self, task_run: VkTaskRun, run_id: str, exc: httpx.HTTPStatusError) -> None:
        detail = self._extract_conflict_detail(exc)
        logger.warning(
            "Execution conflict for task_id=%s, run_id=%s. Conflict detail: %s. Transitioning local run to failed.",
            task_run.task_id,
            run_id,
            detail,
        )
        await self.repository.update_task_run(
            task_run.task_id,
            status="failed",
            finished_at=utcnow(),
            last_error=f"Conflict: {detail} (run {run_id}).",
        )
        await self.repository.save()

    def _extract_conflict_detail(self, exc: httpx.HTTPStatusError) -> str:
        try:
            return exc.response.json().get("detail", "Unknown conflict")
        except Exception:
            return "Unknown conflict"
