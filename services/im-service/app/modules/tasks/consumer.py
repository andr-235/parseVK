import json
import logging

from common.events import TaskEvent
from common.kafka.consumer import BaseEventConsumer
from prometheus_client import Gauge
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.clients.tasks.client import TasksClient
from app.core.config import settings
from app.db.models import ProcessedEvent
from app.db.session import SessionLocal
from app.modules.ingestion.repository import IngestionRepository
from app.modules.ingestion.service import IngestionService
from app.modules.outbox.repository import OutboxRepository
from app.modules.outbox.service import OutboxService
from app.modules.tasks.events import get_messenger
from app.modules.tasks.service import TaskEventsHandler, TaskEventsRepository

logger = logging.getLogger(__name__)

CONSUMER_NAME = "im-service"
DLQ_TOPIC = "parsevk.tasks.dlq"

_consumer_lag = Gauge(
    "kafka_consumer_lag",
    "Consumer lag per partition",
    ["topic", "consumer_group", "partition"],
)


class TaskEventsConsumer(BaseEventConsumer):
    consumer_group = "im-service"
    consumer_name = CONSUMER_NAME
    dlq_topic = DLQ_TOPIC

    def __init__(self, *, session_factory: async_sessionmaker | None = None, tasks_client: TasksClient | None = None):
        super().__init__(
            session_factory=session_factory or SessionLocal,
            kafka_topic=settings.kafka_topic_tasks,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            model_class=ProcessedEvent,
            lag_gauge=_consumer_lag,
        )
        self.tasks_client = tasks_client or TasksClient()

    async def handle_message(self, raw_value: bytes | str | dict) -> None:
        if isinstance(raw_value, bytes):
            raw_value = raw_value.decode("utf-8")
        payload = json.loads(raw_value) if isinstance(raw_value, str) else raw_value
        event = TaskEvent.model_validate(payload)
        if event.event_version != 1:
            logger.warning("Skipping unsupported event version %d for type %s", event.event_version, event.event_type)
            return

        messenger = get_messenger(event)
        if messenger not in ("whatsapp", "max"):
            logger.debug("Skipping event for messenger=%s", messenger)
            return

        async with self.session_factory() as session:
            async with session.begin():
                repository = TaskEventsRepository(session)
                handler = TaskEventsHandler(repository, self.tasks_client)
                task_run = await handler.handle(event)

                if task_run is not None and event.event_type in {"task.created", "task.resumed"}:
                    ingestion = IngestionService(
                        repository=IngestionRepository(session),
                        tasks_client=self.tasks_client,
                        outbox_service=OutboxService(OutboxRepository(session)),
                    )
                    await ingestion.execute(task_run, correlation_id=event.correlation_id)
