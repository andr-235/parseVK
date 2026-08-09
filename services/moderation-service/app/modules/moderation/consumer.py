import json
import logging

from app.core.config import settings
from app.db.models import ProcessedEvent
from app.db.session import async_session_maker
from app.modules.moderation.service import (
    CANONICAL_COMMENTS_EVENT_TYPE,
    ModerationService,
)
from common.events import ContentCanonicalCommentsChangedV1, WireEvent
from common.kafka.consumer import BaseEventConsumer
from prometheus_client import Gauge

logger = logging.getLogger(__name__)

DLQ_TOPIC = "parsevk.moderation.dlq"
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
            kafka_topic=settings.kafka_topic_content,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            model_class=ProcessedEvent,
            lag_gauge=_consumer_lag,
        )

    async def handle_message(self, raw_value: bytes) -> None:
        raw = json.loads(raw_value.decode("utf-8"))
        event = WireEvent.model_validate(raw)
        if event.event_type != CANONICAL_COMMENTS_EVENT_TYPE:
            logger.debug("Ignoring unrelated content event type=%s", event.event_type)
            return
        if event.event_version != 1:
            raise ValueError(
                f"unsupported {CANONICAL_COMMENTS_EVENT_TYPE} version: {event.event_version}"
            )
        payload = ContentCanonicalCommentsChangedV1.model_validate(event.payload)
        logger.debug(
            "Canonical moderation message received event_id=%s chunk=%d/%d",
            event.event_id,
            payload.chunkIndex + 1,
            payload.chunkCount,
        )
        async with self.session_factory() as session:
            async with session.begin():
                service = ModerationService(session)
                await service.handle_event(event, payload)
