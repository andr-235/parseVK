import logging
from datetime import UTC, datetime
from uuid import UUID

import httpx
from common.events import TaskEvent
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.tasks.client import TasksClient
from app.db.models import ImTaskRun, ProcessedEvent
from app.modules.tasks.events import (
    get_group_ids,
    get_messenger,
    get_mode,
    get_owner_user_id,
    get_post_limit,
    get_scope,
    get_task_id,
)

CONSUMER_NAME = "im-service.tasks"

logger = logging.getLogger(__name__)


def utcnow() -> datetime:
    return datetime.now(UTC)


class TaskEventsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def is_processed(self, consumer_name: str, event_id: UUID) -> bool:
        return (
            await self.session.scalar(
                select(ProcessedEvent.id).where(
                    ProcessedEvent.consumer_name == consumer_name,
                    ProcessedEvent.event_id == event_id,
                )
            )
            is not None
        )

    async def mark_processed(self, consumer_name: str, event_id: UUID, event_type: str) -> None:
        stmt = pg_insert(ProcessedEvent).values(
            consumer_name=consumer_name, event_id=event_id, event_type=event_type, processed_at=utcnow(),
        ).on_conflict_do_update(
            constraint="uq_processed_events_consumer_event",
            set_={"processed_at": utcnow(), "retry_count": 0, "last_error": None, "next_retry_at": None},
        )
        await self.session.execute(stmt)

    async def get_task_run(self, task_id: int) -> ImTaskRun | None:
        return await self.session.scalar(select(ImTaskRun).where(ImTaskRun.task_id == task_id))

    async def create_task_run(self, event: TaskEvent, run_id: str) -> ImTaskRun:
        scope = get_scope(event) or "all"
        task_run = ImTaskRun(
            task_id=get_task_id(event),
            owner_user_id=get_owner_user_id(event),
            run_id=run_id,
            status="pending",
            scope=scope,
            mode=get_mode(event) or "recent_posts",
            messenger=get_messenger(event) or "",
            group_ids=get_group_ids(event) if scope == "selected" else None,
            post_limit=get_post_limit(event),
        )
        self.session.add(task_run)
        await self.session.flush()
        return task_run

    async def save(self) -> None:
        await self.session.flush()


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

    async def handle(self, event: TaskEvent) -> ImTaskRun | None:
        if await self.repository.is_processed(self.consumer_name, event.event_id):
            return None

        if event.event_type == "task.deleted":
            result = await self._handle_deleted(event)
        else:
            result = await self._handle_created_or_resumed(event)

        await self.repository.mark_processed(self.consumer_name, event.event_id, event.event_type)
        await self.repository.save()
        return result

    async def _handle_created_or_resumed(self, event: TaskEvent) -> ImTaskRun | None:
        task_id = get_task_id(event)
        run_id = str(event.event_id)
        task_run = await self.repository.get_task_run(task_id)

        if task_run is not None:
            if task_run.status in ("done", "running"):
                return None
            task_run.run_id = run_id
        else:
            task_run = await self.repository.create_task_run(event, run_id)

        try:
            await self.tasks_client.start_execution(
                task_id, run_id, request_id=run_id, correlation_id=event.correlation_id,
            )
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 409:
                detail = "Unknown conflict"
                try:
                    detail = exc.response.json().get("detail", detail)
                except Exception:
                    pass
                logger.warning(
                    "Execution conflict for task_id=%s, run_id=%s: %s",
                    task_id, run_id, detail,
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

    async def _handle_deleted(self, event: TaskEvent) -> ImTaskRun | None:
        task_id = get_task_id(event)
        task_run = await self.repository.get_task_run(task_id)
        if task_run is None:
            return None
        task_run.status = "cancelled"
        task_run.finished_at = utcnow()
        task_run.updated_at = utcnow()
        return task_run
