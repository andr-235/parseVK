from typing import Any

from app.core.config import settings
from app.domain.repositories.ingestion import IngestionRepository
from app.infrastructure.tasks_client.client import TasksClient
from app.infrastructure.vk_client.base import VkApiAdapter
from app.services.domain_events_service import OutboxService
from app.services.ingestion.collector import DataCollector, IngestionResult
from app.services.ingestion.pipeline import IngestionPipeline


class IngestionService:
    def __init__(
        self,
        *,
        adapter: VkApiAdapter,
        repository: IngestionRepository,
        tasks_client: TasksClient,
        collector: DataCollector | None = None,
        pipeline: IngestionPipeline | None = None,
        outbox_service: OutboxService | None = None,
    ):
        self.adapter = adapter
        self.repository = repository
        self.tasks_client = tasks_client
        self.outbox = outbox_service

        self.collector = collector or DataCollector(
            adapter=adapter,
            repository=repository,
            tasks_client=tasks_client,
            outbox=outbox_service,
            on_error=self._sanitize_error,
        )
        self.pipeline = pipeline or IngestionPipeline(
            collector=self.collector,
            tasks_client=tasks_client,
            outbox=outbox_service,
            on_error=self._sanitize_error,
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
