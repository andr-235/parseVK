import logging
from datetime import UTC, datetime

import httpx
from common.events import (
    TaskEvent,
    get_group_ids,
    get_mode,
    get_owner_user_id,
    get_post_limit,
    get_scope,
    get_task_id,
)

from app.domain.entities.tasks import VkTaskRun
from app.domain.repositories.tasks import TaskEventsRepository
from app.infrastructure.tasks_client.client import TasksClient

CONSUMER_NAME = "vk-service"
logger = logging.getLogger("vk-service")
TERMINAL_STATUSES = {
    "task.cancelled": "cancelled",
    "task.completed": "done",
    "task.deleted": "cancelled",
    "task.failed": "failed",
}


def utcnow() -> datetime:
    return datetime.now(UTC)


class TaskEventsService:
    """Handles incoming TaskEvent Kafka messages with a two-phase transaction pattern.

    Phase A (short DB transaction):
        - Idempotency check via is_processed
        - Create or update VkTaskRun with status="pending"
        - Mark event as processed (prevents redelivery from re-triggering handling)
        - Commit

    Phase B (HTTP call, no open transaction):
        - Call tasks_service.start_execution()
        - On 200: continue to Phase C
        - On 409: mark local run as failed (conflict — another worker won)
        - On 404: mark local run as failed (task was deleted)
        - On other errors: leave run in "pending" for lease worker recovery

    Phase C (short DB transaction):
        - Update VkTaskRun status to "running"
        - Commit

    Why mark_processed is in Phase A, not Phase C:
        If mark_processed were in Phase C and the process crashed after
        Phase B success but before Phase C commit, the event would be
        redelivered — is_processed would return False, causing duplicate
        handling. With mark_processed in Phase A, even if Phase C never
        commits, the event is idempotent. The run stays in "pending" and
        the lease worker (TaskExecutor) picks it up via claim_next(),
        calls start_execution with the same run_id, gets 200 (idempotent),
        and updates the local run.
    """

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
        if event.event_type in TERMINAL_STATUSES:
            logger.info(
                "Handling termination event event_id=%s event_type=%s",
                event.event_id,
                event.event_type,
            )
            async with self.repository.session.begin():
                if await self.repository.is_processed(self.consumer_name, event.event_id):
                    return None
                result = await self._handle_termination(event)
                await self.repository.mark_processed(
                    self.consumer_name, event.event_id, event.event_type
                )
            return result

        task_id = get_task_id(event)
        run_id = str(event.payload.get("runId") or event.event_id)
        logger.info(
            "Phase A: preparing task run for event_id=%s task_id=%s run_id=%s",
            event.event_id,
            task_id,
            run_id,
        )

        async with self.repository.session.begin():
            if await self.repository.is_processed(self.consumer_name, event.event_id):
                return None
            task_run = await self._handle_created_or_resumed(event)
            if task_run is None:
                await self.repository.mark_processed(
                    self.consumer_name, event.event_id, event.event_type
                )
                return None
            await self.repository.mark_processed(
                self.consumer_name, event.event_id, event.event_type
            )

        logger.info(
            "Phase B: calling tasks-service start_execution for task_id=%s run_id=%s",
            task_id,
            run_id,
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
                logger.info(
                    "Phase B: received 409 conflict for task_id=%s run_id=%s",
                    task_id,
                    run_id,
                )
                async with self.repository.session.begin():
                    await self._handle_conflict(task_run, run_id, exc)
                return None
            if exc.response.status_code == 404:
                logger.warning(
                    "[FIX] Task %s not found in tasks-service (may have been deleted), skipping",
                    task_id,
                )
                async with self.repository.session.begin():
                    await self.repository.update_task_run(
                        task_id,
                        status="failed",
                        finished_at=utcnow(),
                        last_error=f"Task {task_id} not found in tasks-service",
                        updated_at=utcnow(),
                    )
                return None
            raise

        logger.info(
            "Phase C: marking task run as running for task_id=%s run_id=%s",
            task_id,
            run_id,
        )
        async with self.repository.session.begin():
            await self.repository.update_task_run(
                task_id,
                status="running",
                started_at=task_run.started_at or utcnow(),
                updated_at=utcnow(),
            )
            task_run = await self.repository.get_task_run(task_id)
        return task_run

    async def _handle_created_or_resumed(self, event: TaskEvent) -> VkTaskRun | None:
        task_id = get_task_id(event)
        run_id = str(event.payload.get("runId") or event.event_id)
        task_run = await self.repository.get_task_run(task_id)

        if task_run is not None:
            if task_run.status == "done":
                return None
            if task_run.run_id == run_id and task_run.status in {"pending", "running"}:
                return None
            task_run = await self.repository.update_task_run(
                task_id, run_id=run_id, updated_at=utcnow()
            )
        else:
            task_run = await self.repository.create_task_run(
                task_id=task_id,
                owner_user_id=get_owner_user_id(event),
                run_id=run_id,
                scope=get_scope(event) or "all",
                mode=get_mode(event) or "recent_posts",
                group_ids=get_group_ids(event),
                post_limit=get_post_limit(event),
            )
        return task_run

    async def _handle_termination(self, event: TaskEvent) -> VkTaskRun | None:
        task_id = get_task_id(event)
        task_run = await self.repository.get_task_run(task_id)
        if task_run is None:
            return None

        if task_run.status == "done":
            return None

        # Stale event detection: ignore events for a different run
        event_run_id = event.payload.get("runId")
        if not event_run_id and event.event_type in {"task.completed", "task.failed"}:
            event_run_id = event.correlation_id
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
        values: dict = {
            "status": new_status,
            "finished_at": utcnow(),
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

    def _extract_conflict_detail(self, exc: httpx.HTTPStatusError) -> str:
        try:
            return exc.response.json().get("detail", "Unknown conflict")
        except Exception:
            return "Unknown conflict"
