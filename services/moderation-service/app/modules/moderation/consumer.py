import json
import logging
from datetime import UTC, datetime, timedelta

from app.core.config import settings
from app.db.models import ProcessedEvent
from app.db.session import async_session_maker
from common.events import VkEvent
from common.kafka.consumer import BaseEventConsumer
from app.modules.moderation.service import ModerationService
from prometheus_client import Gauge

logger = logging.getLogger(__name__)

DLQ_TOPIC = "parsevk.vk.dlq"
CONSUMER_NAME = "moderation-service"

try:
    _consumer_lag = Gauge(
        "kafka_consumer_lag",
        "Consumer lag per partition",
        ["topic", "consumer_group", "partition"],
    )
except ValueError:
    from prometheus_client.registry import REGISTRY

    _consumer_lag = REGISTRY._names_to_collectors["kafka_consumer_lag"]


class ProjectionConsumer(BaseEventConsumer):
    consumer_group = "moderation-service-group"
    consumer_name = CONSUMER_NAME
    dlq_topic = DLQ_TOPIC

    def __init__(self):
        super().__init__(
            session_factory=async_session_maker,
            kafka_topic=settings.kafka_topic_vk,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            model_class=ProcessedEvent,
            lag_gauge=_consumer_lag,
        )

    async def handle_message(self, raw_value: bytes) -> None:
        payload = json.loads(raw_value.decode("utf-8"))
        event = VkEvent.model_validate(payload)
        if event.event_version != 1:
            logger.warning(
                "Skipping unsupported event version %d for type %s",
                event.event_version, event.event_type,
            )
            return
        logger.debug(
            "Moderation Kafka message received event_id=%s type=%s",
            event.event_id, event.event_type,
        )
        async with self.session_factory() as session:
            service = ModerationService(session, session_maker=async_session_maker)
            await service.handle_event(event)
