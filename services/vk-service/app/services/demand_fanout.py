"""Project physical source progress into canonical TaskRun lifecycle."""

from app.infrastructure.db.repositories.canonical_executions import (
    report_binding_progress,
)
from app.infrastructure.metrics.vk_metrics import observe_collection_fanout


class DemandLifecycleFanout:
    def __init__(self, *, session):
        self.session = session

    async def report_progress(
        self,
        task_run,
        *,
        processed_items: int,
        total_items: int,
        occurred_at: str,
    ) -> None:
        execution_id = getattr(task_run, "execution_id", None)
        if execution_id is None:
            return
        emitted = await report_binding_progress(
            self.session,
            execution_id=execution_id,
            processed_items=processed_items,
            total_items=total_items,
            stats={},
            occurred_at=occurred_at,
        )
        observe_collection_fanout("progress", emitted)
