from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.tasks.client import TasksClient
from app.db.models import ProcessedEvent, VkTaskRun
from app.modules.tasks.events import TaskEvent

CONSUMER_NAME = "vk-service.tasks"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class TaskRunState:
    task_id: int
    run_id: str
    status: str


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
        self.session.add(
            ProcessedEvent(consumer_name=consumer_name, event_id=event_id, event_type=event_type, processed_at=utcnow())
        )

    async def get_task_run(self, task_id: int) -> VkTaskRun | None:
        return await self.session.scalar(select(VkTaskRun).where(VkTaskRun.task_id == task_id))

    async def create_task_run(self, event: TaskEvent, run_id: str) -> VkTaskRun:
        task_run = VkTaskRun(
            task_id=event.task_id(),
            owner_user_id=event.owner_user_id(),
            run_id=run_id,
            status="pending",
            scope=event.scope(),
            mode=event.mode(),
            group_ids=event.group_ids(),
            post_limit=event.post_limit(),
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

    async def handle(self, event: TaskEvent) -> TaskRunState | None:
        if await self.repository.is_processed(self.consumer_name, event.event_id):
            return None

        if event.event_type == "task.deleted":
            result = await self._handle_deleted(event)
        else:
            result = await self._handle_created_or_resumed(event)

        await self.repository.mark_processed(self.consumer_name, event.event_id, event.event_type)
        await self.repository.save()
        return result

    async def _handle_created_or_resumed(self, event: TaskEvent) -> TaskRunState:
        task_id = event.task_id()
        run_id = str(event.event_id)
        task_run = await self.repository.get_task_run(task_id)
        if task_run is None:
            task_run = await self.repository.create_task_run(event, run_id)
        elif task_run.status == "running":
            return TaskRunState(task_id=task_id, run_id=task_run.run_id, status=task_run.status)
        else:
            task_run.run_id = run_id

        await self.tasks_client.start_execution(
            task_id,
            run_id,
            request_id=run_id,
            correlation_id=event.correlation_id,
        )
        task_run.status = "running"
        task_run.started_at = task_run.started_at or utcnow()
        task_run.updated_at = utcnow()
        return TaskRunState(task_id=task_id, run_id=run_id, status="running")

    async def _handle_deleted(self, event: TaskEvent) -> TaskRunState | None:
        task_id = event.task_id()
        task_run = await self.repository.get_task_run(task_id)
        if task_run is None:
            return None
        task_run.status = "cancelled"
        task_run.finished_at = utcnow()
        task_run.updated_at = utcnow()
        return TaskRunState(task_id=task_id, run_id=task_run.run_id, status="cancelled")
