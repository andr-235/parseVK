from app.infrastructure.db.repositories.executions import (
    SqlAlchemyExecutionRepository,
)
from app.infrastructure.metrics.vk_metrics import observe_collection_fanout


class DemandLifecycleFanout:
    """Publish physical-source progress once per affected TaskRun binding."""

    def __init__(
        self,
        *,
        session,
        collection_repository,
        outbox,
    ):
        self.repository = SqlAlchemyExecutionRepository(session)

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
        emitted = await self.repository.report_progress(
            execution_id=execution_id,
            processed_items=processed_items,
            total_items=total_items,
            stats={},
            occurred_at=occurred_at,
        )
        observe_collection_fanout("progress", emitted)
