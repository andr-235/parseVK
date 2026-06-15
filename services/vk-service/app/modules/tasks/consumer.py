import json
from contextlib import suppress

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.clients.tasks.client import TasksClient
from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.ingestion.repository import IngestionRepository
from app.modules.ingestion.service import IngestionService
from app.modules.outbox.repository import OutboxRepository
from app.modules.outbox.service import OutboxService
from app.modules.tasks.events import TaskEvent
from app.modules.tasks.service import TaskEventsHandler, TaskEventsRepository
from app.modules.vk_api.client import VkApiClient


class TaskEventsConsumer:
    def __init__(
        self,
        *,
        session_factory: async_sessionmaker | None = None,
        tasks_client: TasksClient | None = None,
    ):
        self.session_factory = session_factory or SessionLocal
        self.tasks_client = tasks_client or TasksClient()
        self._consumer = None

    async def run_forever(self) -> None:
        from aiokafka import AIOKafkaConsumer

        self._consumer = AIOKafkaConsumer(
            settings.kafka_topic_tasks,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id="vk-service",
            enable_auto_commit=False,
        )
        await self._consumer.start()
        try:
            async for message in self._consumer:
                await self.handle_message(message.value)
                await self._consumer.commit()
        finally:
            await self.stop()

    async def handle_message(self, raw_value: bytes | str | dict) -> None:
        if isinstance(raw_value, bytes):
            raw_value = raw_value.decode("utf-8")
        payload = json.loads(raw_value) if isinstance(raw_value, str) else raw_value
        event = TaskEvent.model_validate(payload)
        async with self.session_factory() as session:
            async with session.begin():
                repository = TaskEventsRepository(session)
                handler = TaskEventsHandler(repository, self.tasks_client)
                task_run = await handler.handle(event)
                if task_run is not None and event.event_type in {"task.created", "task.resumed"}:
                    adapter = VkApiClient()
                    ingestion = IngestionService(
                        adapter=adapter,
                        repository=IngestionRepository(session),
                        tasks_client=self.tasks_client,
                        outbox_service=OutboxService(OutboxRepository(session)),
                    )
                    await ingestion.execute(task_run, correlation_id=event.correlation_id)

    async def stop(self) -> None:
        if self._consumer is not None:
            with suppress(Exception):
                await self._consumer.stop()
            self._consumer = None
