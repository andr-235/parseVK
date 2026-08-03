import logging
from copy import deepcopy

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

from app.domain.entities.executions import VkExecution
from app.domain.repositories.tasks import TaskEventsRepository
from app.infrastructure.tasks_client.client import TasksClient

CONSUMER_NAME = "vk-service"
logger = logging.getLogger("vk-service")
CANCELLATION_EVENTS = frozenset({"task.cancelled", "task.deleted"})
IGNORED_TERMINAL_EVENTS = frozenset({"task.completed", "task.failed"})


class TaskEventsService:
    """Translate task lifecycle events into immutable VK executions."""

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

    async def handle(self, event: TaskEvent) -> VkExecution | None:
        task_id = get_task_id(event)
        run_id = str(event.payload.get("runId") or event.event_id)

        async with self.repository.session.begin():
            if await self.repository.is_processed(self.consumer_name, event.event_id):
                return None

            if event.event_type in CANCELLATION_EVENTS:
                execution = await self.repository.request_cancellation(
                    task_id=task_id,
                    run_id=event.payload.get("runId"),
                    reason=event.event_type,
                )
                await self.repository.mark_processed(
                    self.consumer_name, event.event_id, event.event_type
                )
                return execution

            if event.event_type in IGNORED_TERMINAL_EVENTS:
                await self.repository.mark_processed(
                    self.consumer_name, event.event_id, event.event_type
                )
                return None

            execution = await self._create_execution(event, run_id)
            await self.repository.mark_processed(
                self.consumer_name, event.event_id, event.event_type
            )

        if execution is None:
            return None

        try:
            await self.tasks_client.start_execution(
                task_id,
                run_id,
                request_id=run_id,
                correlation_id=event.correlation_id,
            )
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in {404, 409}:
                detail = self._extract_detail(exc)
                async with self.repository.session.begin():
                    await self.repository.fail_pending(
                        execution.id,
                        f"tasks-service rejected execution: {detail}",
                    )
                return None
            raise
        return execution

    async def _create_execution(
        self, event: TaskEvent, run_id: str
    ) -> VkExecution | None:
        task_id = get_task_id(event)
        existing = await self.repository.get_execution(task_id, run_id)
        if existing is not None:
            return None

        active = await self.repository.get_active_execution(task_id)
        if active is not None:
            logger.warning(
                "Ignoring new VK run while task has active execution "
                "task_id=%s active_run=%s requested_run=%s",
                task_id,
                active.run_id,
                run_id,
            )
            return None

        latest = await self.repository.get_latest_execution(task_id)
        payload = deepcopy(event.payload)
        group_ids = get_group_ids(event)
        scope = get_scope(event) or "all"
        mode = get_mode(event) or "recent_posts"
        post_limit = get_post_limit(event)
        plan_snapshot = {
            "eventType": event.event_type,
            "scope": scope,
            "mode": mode,
            "groupIds": group_ids,
            "postLimit": post_limit,
            "payload": payload,
        }
        return await self.repository.create_execution(
            task_id=task_id,
            owner_user_id=get_owner_user_id(event),
            run_id=run_id,
            scope=scope,
            mode=mode,
            group_ids=group_ids,
            post_limit=post_limit,
            plan_snapshot=plan_snapshot,
            parent_execution_id=latest.id if latest is not None and latest.is_terminal else None,
        )

    @staticmethod
    def _extract_detail(exc: httpx.HTTPStatusError) -> str:
        try:
            return str(exc.response.json().get("detail") or exc.response.status_code)
        except Exception:
            return str(exc.response.status_code)
