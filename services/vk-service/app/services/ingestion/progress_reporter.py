from typing import Any

from app.infrastructure.tasks_client.client import TasksClient
from app.services.ingestion.result import IngestionResult


class ProgressReporter:
    def __init__(
        self,
        *,
        tasks_client: TasksClient,
        outbox=None,
    ):
        self.tasks_client = tasks_client
        self.outbox = outbox

    async def report(
        self,
        task_run: Any,
        result: IngestionResult,
        correlation_id: str | None,
    ) -> None:
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
