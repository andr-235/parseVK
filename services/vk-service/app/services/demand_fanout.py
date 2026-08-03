import logging
from types import SimpleNamespace

import httpx
from common.events.task_execution_progressed import TaskExecutionProgressedPayload
from sqlalchemy import text

logger = logging.getLogger("vk-service.demand-fanout")


class DemandLifecycleFanout:
    def __init__(
        self,
        *,
        session,
        collection_repository,
        tasks_client,
        outbox,
    ):
        self.session = session
        self.collection_repository = collection_repository
        self.tasks_client = tasks_client
        self.outbox = outbox

    async def active_demands(self, task_run) -> list:
        execution_id = getattr(task_run, "execution_id", None)
        if execution_id is not None:
            demands = await self.collection_repository.list_active_demands(execution_id)
            if demands:
                return demands
        return [
            SimpleNamespace(
                id=None,
                task_id=task_run.task_id,
                run_id=task_run.run_id,
                owner_user_id=getattr(task_run, "owner_user_id", "") or "",
                execution_sequence=getattr(task_run, "execution_sequence", 0),
            )
        ]

    async def complete_callbacks(
        self,
        task_run,
        *,
        processed_items: int,
        total_items: int,
        stats: dict,
        correlation_id: str | None,
    ) -> None:
        for demand in await self.active_demands(task_run):
            await self.tasks_client.complete_execution(
                demand.task_id,
                demand.run_id,
                processed_items,
                total_items,
                stats,
                request_id=demand.run_id,
                correlation_id=correlation_id or demand.run_id,
            )

    async def fail_callbacks(
        self,
        task_run,
        *,
        error: str,
        processed_items: int,
        total_items: int,
        stats: dict,
        correlation_id: str | None,
    ) -> None:
        for demand in await self.active_demands(task_run):
            try:
                await self.tasks_client.fail_execution(
                    demand.task_id,
                    demand.run_id,
                    error,
                    processed_items,
                    total_items,
                    stats,
                    request_id=demand.run_id,
                    correlation_id=correlation_id or demand.run_id,
                )
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code != 409:
                    raise
                logger.warning(
                    "Fail callback conflict task_id=%s run_id=%s",
                    demand.task_id,
                    demand.run_id,
                )

    async def report_progress(
        self,
        task_run,
        *,
        processed_items: int,
        total_items: int,
        occurred_at: str,
    ) -> None:
        progress = processed_items / total_items if total_items > 0 else 0.0
        for demand in await self.active_demands(task_run):
            sequence = await self._next_sequence(demand)
            payload = TaskExecutionProgressedPayload(
                taskId=demand.task_id,
                runId=demand.run_id,
                ownerUserId=demand.owner_user_id,
                executor="vk-service",
                executionSequence=sequence,
                processedItems=processed_items,
                totalItems=total_items,
                progress=progress,
                stats={},
                occurredAt=occurred_at,
            )
            await self.outbox.repository.add_event(
                event_type="task.execution_progressed",
                aggregate_type="task",
                aggregate_id=str(demand.task_id),
                dedupe_key=(
                    f"task.execution_progressed:{demand.task_id}:"
                    f"{demand.run_id}:{sequence}"
                ),
                payload=payload.model_dump(mode="json"),
            )

    async def _next_sequence(self, demand) -> int:
        if demand.id is None:
            return int(demand.execution_sequence) + 1
        result = await self.session.execute(
            text(
                """
                UPDATE vk_collection_demands
                SET execution_sequence = execution_sequence + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :demand_id
                  AND status IN ('pending', 'running')
                RETURNING execution_sequence
                """
            ),
            {"demand_id": demand.id},
        )
        row = result.one_or_none()
        if row is None:
            raise RuntimeError(f"active collection demand {demand.id} disappeared")
        return int(row[0])
