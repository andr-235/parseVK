import json
import logging

from common.events import TaskEvent
from common.kafka.consumer import BaseEventConsumer
from prometheus_client import REGISTRY, Gauge
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.bootstrap import get_task_events_handler
from app.core.config import settings
from app.infrastructure.db.models.tasks import ProcessedEvent

logger = logging.getLogger(__name__)

CONSUMER_NAME = "vk-service"
DLQ_TOPIC = "parsevk.tasks.dlq"
CANCELLATION_EVENTS = frozenset({"task.cancelled", "task.deleted"})


def _create_lag_gauge(
    name: str,
    description: str,
) -> Gauge:
    try:
        return Gauge(
            name,
            description,
            ["topic", "consumer_group", "partition"],
        )
    except ValueError:
        return REGISTRY._names_to_collectors[name]  # type: ignore[return-value]


_consumer_lag = _create_lag_gauge(
    "kafka_consumer_lag",
    "Legacy task-events consumer lag per partition",
)
_cancellation_consumer_lag = _create_lag_gauge(
    "vk_task_cancellation_consumer_lag",
    "Task cancellation consumer lag per partition",
)


class TaskEventsConsumer(BaseEventConsumer):
    consumer_group = "vk-service"
    consumer_name = CONSUMER_NAME
    dlq_topic = DLQ_TOPIC
    accepted_event_types: frozenset[str] | None = None
    lag_gauge = _consumer_lag

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
            lag_gauge=self.lag_gauge,
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
        if (
            self.accepted_event_types is not None
            and event.event_type not in self.accepted_event_types
        ):
            return
        async with self.session_factory() as session:
            handler = get_task_events_handler(session)
            await handler.handle(event)


class TaskCancellationEventsConsumer(TaskEventsConsumer):
    """Keep cancellation delivery active during canonical-command rollout."""

    consumer_group = "vk-service-task-cancellations-v1"
    consumer_name = "vk-service-task-cancellations"
    accepted_event_types = CANCELLATION_EVENTS
    lag_gauge = _cancellation_consumer_lag
