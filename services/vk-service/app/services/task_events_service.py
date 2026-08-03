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
from app.domain.entities.source_collections import CollectionDemand
from app.domain.repositories.tasks import TaskEventsRepository
from app.infrastructure.metrics.vk_metrics import observe_collection_demand_attached
from app.infrastructure.tasks_client.client import TasksClient
from app.services.collection_fingerprint import build_collection_identity

CONSUMER_NAME = "vk-service"
SYSTEM_PROVIDER_ACCOUNT_KEY = "system-vk"
logger = logging.getLogger("vk-service")
CANCELLATION_EVENTS = frozenset({"task.cancelled", "task.deleted"})
IGNORED_TERMINAL_EVENTS = frozenset({"task.completed", "task.failed"})


class TaskEventsService:
    """Translate task lifecycle events into coalesced VK collection demands."""

    def __init__(
        self,
        repository: TaskEventsRepository,
        tasks_client: TasksClient,
        *,
        collection_repository=None,
        consumer_name: str = CONSUMER_NAME,
    ):
        self.repository = repository
        self.collection_repository = collection_repository or repository
        self.tasks_client = tasks_client
        self.consumer_name = consumer_name

    async def handle(self, event: TaskEvent) -> VkExecution | CollectionDemand | None:
        task_id = get_task_id(event)
        run_id = str(event.payload.get("runId") or event.event_id)

        async with self.repository.session.begin():
            if await self.repository.is_processed(self.consumer_name, event.event_id):
                return None

            if event.event_type in CANCELLATION_EVENTS:
                demand = await self.collection_repository.request_cancellation(
                    task_id=task_id,
                    run_id=event.payload.get("runId"),
                    reason=event.event_type,
                )
                await self.repository.mark_processed(
                    self.consumer_name, event.event_id, event.event_type
                )
                return demand

            if event.event_type in IGNORED_TERMINAL_EVENTS:
                await self.repository.mark_processed(
                    self.consumer_name, event.event_id, event.event_type
                )
                return None

            attachment = await self._attach_demand(event, run_id)
            await self.repository.mark_processed(
                self.consumer_name, event.event_id, event.event_type
            )

        if attachment is None:
            return None

        observe_collection_demand_attached(
            coalesced=not attachment.collection_created
        )
        demand = attachment.demand
        try:
            await self.tasks_client.start_execution(
                demand.task_id,
                demand.run_id,
                request_id=demand.run_id,
                correlation_id=event.correlation_id,
            )
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in {404, 409}:
                detail = self._extract_detail(exc)
                async with self.repository.session.begin():
                    await self.collection_repository.fail_pending_demand(
                        task_id=demand.task_id,
                        run_id=demand.run_id,
                        error=f"tasks-service rejected demand: {detail}",
                    )
                return None
            raise
        logger.info(
            "Attached VK demand task_id=%s run_id=%s collection_id=%s new_collection=%s",
            demand.task_id,
            demand.run_id,
            attachment.collection.id,
            attachment.collection_created,
        )
        return attachment.execution

    async def _attach_demand(self, event: TaskEvent, run_id: str):
        payload = deepcopy(event.payload)
        group_ids = get_group_ids(event)
        scope = get_scope(event) or "all"
        mode = get_mode(event) or "recent_posts"
        post_limit = get_post_limit(event)
        identity = build_collection_identity(
            provider_account_key=SYSTEM_PROVIDER_ACCOUNT_KEY,
            scope=scope,
            mode=mode,
            group_ids=group_ids,
            post_limit=post_limit,
            payload=payload,
        )
        plan_snapshot = {
            "eventType": event.event_type,
            "scope": scope,
            "mode": mode,
            "groupIds": identity.normalized_plan["groupIds"],
            "postLimit": post_limit,
            "sourceKey": identity.source_key,
            "collectionFingerprint": identity.fingerprint,
            "providerAccountKey": identity.provider_account_key,
            "payload": payload,
        }
        return await self.collection_repository.attach_demand(
            task_id=get_task_id(event),
            owner_user_id=get_owner_user_id(event),
            run_id=run_id,
            provider_account_key=identity.provider_account_key,
            source_key=identity.source_key,
            fingerprint=identity.fingerprint,
            scope=scope,
            mode=mode,
            group_ids=identity.normalized_plan["groupIds"],
            post_limit=post_limit,
            plan_snapshot=plan_snapshot,
        )

    @staticmethod
    def _extract_detail(exc: httpx.HTTPStatusError) -> str:
        try:
            return str(exc.response.json().get("detail") or exc.response.status_code)
        except Exception:
            return str(exc.response.status_code)
