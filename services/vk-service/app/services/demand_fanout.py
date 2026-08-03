from types import SimpleNamespace

from common.events.task_execution_progressed import TaskExecutionProgressedPayload
from sqlalchemy import text

from app.infrastructure.metrics.vk_metrics import observe_collection_fanout


class DemandLifecycleFanout:
    """Fan out non-terminal lifecycle updates to active collection demands.

    Terminal completion and failure are deliberately not delivered over HTTP
    here. They are emitted only by the fenced execution repository as durable
    per-demand outbox events after the current attempt wins the terminal write.
    """

    def __init__(
        self,
        *,
        session,
        collection_repository,
        outbox,
    ):
        self.session = session
        self.collection_repository = collection_repository
        self.outbox = outbox

    async def active_demands(self, task_run) -> list:
        execution_id = getattr(task_run, "execution_id", None)
        if execution_id is not None:
            demands = await self.collection_repository.list_active_demands(execution_id)
            if demands:
                return demands
            if await self.collection_repository.has_collection(execution_id):
                return []
        return [
            SimpleNamespace(
                id=None,
                task_id=task_run.task_id,
                run_id=task_run.run_id,
                owner_user_id=getattr(task_run, "owner_user_id", "") or "",
                execution_sequence=getattr(task_run, "execution_sequence", 0),
            )
        ]

    async def report_progress(
        self,
        task_run,
        *,
        processed_items: int,
        total_items: int,
        occurred_at: str,
    ) -> None:
        demands = await self.active_demands(task_run)
        progress = processed_items / total_items if total_items > 0 else 0.0
        for demand in demands:
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
        observe_collection_fanout("progress", len(demands))

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