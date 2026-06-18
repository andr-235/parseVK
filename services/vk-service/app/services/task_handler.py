import logging
from datetime import UTC, datetime
from typing import Any, Literal
from uuid import UUID

import httpx
from pydantic import BaseModel, ConfigDict

from app.domain.models.tasks import VkTaskRun
from app.domain.repositories.tasks import TaskEventsRepository
from app.infrastructure.tasks_client.client import TasksClient

CONSUMER_NAME = "vk-service.tasks"
logger = logging.getLogger("vk-service.tasks")

def utcnow() -> datetime:
    return datetime.now(UTC)

class TaskEvent(BaseModel):
    event_id: UUID
    event_type: Literal["task.created", "task.resumed", "task.deleted"]
    event_version: int
    aggregate_id: str
    correlation_id: str | None = None
    payload: dict[str, Any]

    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    def task_id(self) -> int:
        return int(self.payload["taskId"])

    def owner_user_id(self) -> str:
        return str(self.payload.get("ownerUserId") or "unknown")

    def scope(self) -> str:
        return str(self.payload.get("scope") or "all")

    def mode(self) -> str:
        return str(self.payload.get("mode") or "recent_posts")

    def group_ids(self) -> list[int]:
        return [int(item) for item in self.payload.get("groupIds") or []]

    def post_limit(self) -> int | None:
        value = self.payload.get("postLimit")
        return int(value) if value is not None else None

class TaskEventsHandler:
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

        if event.event_type == "task.deleted":
            result = await self._handle_deleted(event)
        else:
            result = await self._handle_created_or_resumed(event)

        await self.repository.mark_processed(self.consumer_name, event.event_id, event.event_type)
        await self.repository.save()
        return result

    async def _handle_created_or_resumed(self, event: TaskEvent) -> VkTaskRun | None:
        task_id = event.task_id()
        run_id = str(event.event_id)
        task_run = await self.repository.get_task_run(task_id)

        if task_run is not None:
            if task_run.status == "done":
                return None
            if task_run.status == "running":
                return None
            task_run.run_id = run_id
        else:
            task_run = await self.repository.create_task_run(
                task_id=task_id,
                owner_user_id=event.owner_user_id(),
                run_id=run_id,
                scope=event.scope(),
                mode=event.mode(),
                group_ids=event.group_ids(),
                post_limit=event.post_limit(),
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
                detail = "Unknown conflict"
                try:
                    detail = exc.response.json().get("detail", detail)
                except Exception:
                    pass

                logger.warning(
                    "Execution conflict for task_id=%s, run_id=%s. Conflict detail: %s. Transitioning local run to failed.",
                    task_id,
                    run_id,
                    detail,
                )
                task_run.status = "failed"
                task_run.finished_at = utcnow()
                task_run.last_error = f"Conflict: {detail} (run {run_id})."
                await self.repository.save()
                return None
            raise

        task_run.status = "running"
        task_run.started_at = task_run.started_at or utcnow()
        task_run.updated_at = utcnow()
        return task_run

    async def _handle_deleted(self, event: TaskEvent) -> VkTaskRun | None:
        task_id = event.task_id()
        task_run = await self.repository.get_task_run(task_id)
        if task_run is None:
            return None
        task_run.status = "cancelled"
        task_run.finished_at = utcnow()
        task_run.updated_at = utcnow()
        return task_run
