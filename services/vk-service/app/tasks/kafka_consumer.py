import json
import logging

from common.events import TaskEvent
from common.kafka.consumer import BaseEventConsumer
from prometheus_client import Gauge
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.bootstrap import get_task_events_handler
from app.core.config import settings
from app.infrastructure.db.models.tasks import ProcessedEvent

logger = logging.getLogger(__name__)

CONSUMER_NAME = "vk-service"
DLQ_TOPIC = "parsevk.tasks.dlq"

_consumer_lag = Gauge(
    "kafka_consumer_lag",
    "Consumer lag per partition",
    ["topic", "consumer_group", "partition"],
)


class TaskEventsConsumer(BaseEventConsumer):
    consumer_group = "vk-service"
    consumer_name = CONSUMER_NAME
    dlq_topic = DLQ_TOPIC

    def __init__(
        self,
        *,
        session_factory: async_sessionmaker,
    ):
        super().__init__(
            session_factory=session_factory,
            kafka_topic=settings.kafka_topic_tasks,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            model_class=ProcessedEvent,
            lag_gauge=_consumer_lag,
        )

    async def handle_message(self, raw_value: bytes | str | dict) -> None:
        if isinstance(raw_value, bytes):
            raw_value = raw_value.decode("utf-8")
        payload = json.loads(raw_value) if isinstance(raw_value, str) else raw_value
        try:
            event = TaskEvent.model_validate(payload)
        except Exception as exc:
            logger.warning("Skipping unknown event: %s, payload: %s", exc, payload)
            return
        if event.event_version != 1:
            logger.warning(
                "Skipping unsupported event version %d for type %s",
                event.event_version,
                event.event_type,
            )
            return
        async with self.session_factory() as session:
            handler = get_task_events_handler(session)
            await handler.handle(event)
