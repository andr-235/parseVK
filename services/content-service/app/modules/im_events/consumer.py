import json
import logging

from prometheus_client import Gauge
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.db.models import ProcessedEvent
from app.db.session import SessionLocal
from common.events import ImEvent
from common.kafka.consumer import BaseEventConsumer
from app.modules.im_events.service import ImEventRepository, ImEventService

logger = logging.getLogger(__name__)

CONSUMER_NAME = "content-service-im"
DLQ_TOPIC = "parsevk.im.dlq"

_consumer_lag = Gauge(
    "kafka_consumer_lag_im",
    "Consumer lag per partition (im events)",
    ["topic", "consumer_group", "partition"],
)


class ImEventConsumer(BaseEventConsumer):
    consumer_group = "content-service-im"
    consumer_name = CONSUMER_NAME
    dlq_topic = DLQ_TOPIC

    def __init__(self, *, session_factory: async_sessionmaker | None = None):
        super().__init__(
            session_factory=session_factory or SessionLocal,
            kafka_topic=settings.kafka_topic_im,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            model_class=ProcessedEvent,
            lag_gauge=_consumer_lag,
        )

    async def handle_message(self, raw_value: bytes | str | dict) -> None:
        if isinstance(raw_value, bytes):
            raw_value = raw_value.decode("utf-8")
        payload = json.loads(raw_value) if isinstance(raw_value, str) else raw_value
        event = ImEvent.model_validate(payload)
        if event.event_version != 1:
            logger.warning("Skipping unsupported event version %d for type %s", event.event_version, event.event_type)
            return
        async with self.session_factory() as session:
            async with session.begin():
                await ImEventService(ImEventRepository(session)).handle(event)
