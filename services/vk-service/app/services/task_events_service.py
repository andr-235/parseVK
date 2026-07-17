import logging
from datetime import UTC, datetime

from common.events import TaskEvent

from app.domain.entities.tasks import VkTaskRun
from app.domain.events.task_event_mapper import TaskEventMapper
from app.domain.repositories.tasks import TaskEventsRepository

CONSUMER_NAME = "vk-service.tasks"
logger = logging.getLogger("vk-service.tasks")
TERMINAL_STATUSES = {
    "task.cancelled": "cancelled",
    "task.completed": "done",
    "task.deleted": "cancelled",
    "task.failed": "failed",
}


def utcnow() -> datetime:
    return datetime.now(UTC)


class TaskEventsService:
    def __init__(
        self,
        repository: TaskEventsRepository,
        *,
        consumer_name: str = CONSUMER_NAME,
    ):
        self.repository = repository
        self.consumer_name = consumer_name

    async def handle(self, event: TaskEvent) -> VkTaskRun | None:
        if await self.repository.is_processed(self.consumer_name, event.event_id):
            return None

        if event.event_type in TERMINAL_STATUSES:
            result = await self._handle_termination(event)
        else:
            result = await self._handle_created_or_resumed(event)

        await self.repository.mark_processed(self.consumer_name, event.event_id, event.event_type)
        await self.repository.save()
        return result

    async def _handle_created_or_resumed(self, event: TaskEvent) -> VkTaskRun | None:
        task_id = TaskEventMapper.get_task_id(event)
        run_id = TaskEventMapper.get_requested_run_id(event)
        task_run = await self.repository.get_task_run(task_id)

        if task_run is not None:
            if task_run.status == "done":
                return None
            if task_run.run_id == run_id and task_run.status in {"pending", "running"}:
                return None
            task_run = await self.repository.update_task_run(
                task_id,
                run_id=run_id,
                status="pending",
                started_at=None,
                finished_at=None,
                processed_items=0,
                total_items=0,
                last_error=None,
                attempts=0,
                available_at=utcnow(),
                lease_owner=None,
                lease_expires_at=None,
                heartbeat_at=None,
                updated_at=utcnow(),
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
        logger.info("Queued VK task task_id=%s run_id=%s", task_id, run_id)
        return task_run

    async def _handle_termination(self, event: TaskEvent) -> VkTaskRun | None:
        task_id = TaskEventMapper.get_task_id(event)
        task_run = await self.repository.get_task_run(task_id)
        if task_run is None:
            return None

        if task_run.status == "done":
            return None

        event_run_id = TaskEventMapper.get_terminal_run_id(event)
        if event_run_id and event_run_id != task_run.run_id:
            logger.info(
                "Ignored stale task event task_id=%s event=%s event_run=%s active_run=%s",
                task_id,
                event.event_type,
                event_run_id,
                task_run.run_id,
            )
            return None

        new_status = TERMINAL_STATUSES[event.event_type]
        values = {
            "status": new_status,
            "finished_at": utcnow(),
            "lease_owner": None,
            "lease_expires_at": None,
            "updated_at": utcnow(),
        }
        if new_status == "done":
            values.update(
                processed_items=int(event.payload.get("processedItems") or 0),
                total_items=int(event.payload.get("totalItems") or 0),
                last_error=None,
            )
        elif new_status == "failed":
            values["last_error"] = str(event.payload.get("error") or "Task failed")
        task_run = await self.repository.update_task_run(
            task_id,
            **values,
        )
        return task_run
