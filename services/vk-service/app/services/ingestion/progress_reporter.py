from collections.abc import Awaitable, Callable
from typing import Any

from app.infrastructure.tasks_client.client import TasksClient
from app.services.ingestion.result import IngestionResult


async def _noop_checkpoint() -> None:
    return None


class ProgressReporter:
    def __init__(
        self,
        *,
        tasks_client: TasksClient,
        outbox=None,
        checkpoint: Callable[[], Awaitable[None]] | None = None,
    ):
        self.tasks_client = tasks_client
        self.outbox = outbox
        self.checkpoint = checkpoint or _noop_checkpoint

    async def report(
        self,
        task_run: Any,
        result: IngestionResult,
        correlation_id: str | None,
    ) -> None:
        if self.outbox:
            await self.outbox.emit_task_progress_updated(
                task_id=task_run.task_id,
                run_id=task_run.run_id,
                processed_items=result.processed_items,
                total_items=result.processed_items,
                progress=1,
                stats=result.stats(),
                correlation_id=correlation_id,
            )
        await self.checkpoint()
        await self.tasks_client.update_progress(
            task_run.task_id,
            task_run.run_id,
            result.processed_items,
            result.processed_items,
            1,
            result.stats(),
            request_id=task_run.run_id,
            correlation_id=correlation_id,
        )
