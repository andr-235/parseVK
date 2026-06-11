from typing import Any

from app.clients.tasks.client import TasksClient
from app.core.config import settings
from app.modules.ingestion.collector import DataCollector, IngestionResult
from app.modules.ingestion.pipeline import IngestionPipeline
from app.modules.vk_api.client import VkApiAdapter


class IngestionService:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository,
        tasks_client: TasksClient,
        outbox_service=None,
    ):
        self.adapter = adapter
        self.repository = repository
        self.tasks_client = tasks_client
        self.outbox = outbox_service

        svc = self
        self.collector = DataCollector(
            adapter=adapter,
            repository=repository,
            tasks_client=tasks_client,
            outbox=outbox_service,
            on_error=lambda msg: svc._sanitize_error(msg),
        )
        self.pipeline = IngestionPipeline(
            collector=self.collector,
            tasks_client=tasks_client,
            outbox=outbox_service,
            on_error=lambda msg: svc._sanitize_error(msg),
        )

    def _sanitize_error(self, error: str) -> str:
        token = None
        if hasattr(self.adapter, "token") and self.adapter.token:
            token = self.adapter.token
        else:
            token = settings.vk_token

        if token and token in error:
            return error.replace(token, "<redacted>")
        return error

    async def execute(
        self, task_run: Any, *, correlation_id: str | None = None
    ) -> IngestionResult:
        return await self.pipeline.execute(task_run, correlation_id=correlation_id)
