import json
import logging
from contextlib import suppress

from prometheus_client import Gauge
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.projections.processor import ProjectionRepository, VkEvent
from app.modules.projections.service import ProjectionService

logger = logging.getLogger(__name__)

DLQ_TOPIC = "parsevk.vk.dlq"
MAX_CONSUMER_RETRIES = 3

_consumer_lag = Gauge(
    "kafka_consumer_lag_vk",
    "Consumer lag per partition (vk events)",
    ["topic", "consumer_group", "partition"],
)


class ProjectionConsumer:
    def __init__(self, *, session_factory: async_sessionmaker | None = None):
        self.session_factory = session_factory or SessionLocal
        self._consumer = None
        self._retry_count: dict[str, int] = {}

    async def run_forever(self) -> None:
        from aiokafka import AIOKafkaConsumer

        self._consumer = AIOKafkaConsumer(
            settings.kafka_topic_vk,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id="content-service",
            enable_auto_commit=False,
        )
        await self._consumer.start()
        logger.info("Kafka consumer started, group=content-service, topic=%s", settings.kafka_topic_vk)
        try:
            async for message in self._consumer:
                message_key = f"{message.partition}:{message.offset}"
                try:
                    await self.handle_message(message.value)
                    await self._consumer.commit()
                    self._retry_count.pop(message_key, None)
                except Exception:
                    retries = self._retry_count.get(message_key, 0) + 1
                    self._retry_count[message_key] = retries
                    if retries >= MAX_CONSUMER_RETRIES:
                        logger.exception(
                            "Failed to process message at offset %s after %d retries, sending to DLQ",
                            message.offset, retries,
                        )
                        await self._send_to_dlq(message.value)
                        self._retry_count.pop(message_key, None)
                        await self._consumer.commit()
                    else:
                        logger.exception(
                            "Failed to process message at offset %s (retry %d/%d)",
                            message.offset, retries, MAX_CONSUMER_RETRIES,
                        )
                self._update_lag_metric(message)
        finally:
            await self.stop()

    def _update_lag_metric(self, message) -> None:
        try:
            lag = message.highwater_mark - message.offset - 1 if message.highwater_mark is not None else 0
            _consumer_lag.labels(
                topic=message.topic,
                consumer_group="content-service",
                partition=str(message.partition),
            ).set(max(lag, 0))
        except Exception:
            pass

    async def handle_message(self, raw_value: bytes | str | dict) -> None:
        if isinstance(raw_value, bytes):
            raw_value = raw_value.decode("utf-8")
        payload = json.loads(raw_value) if isinstance(raw_value, str) else raw_value
        event = VkEvent.model_validate(payload)
        if event.event_version != 1:
            logger.warning("Skipping unsupported event version %d for type %s", event.event_version, event.event_type)
            return
        async with self.session_factory() as session:
            async with session.begin():
                await ProjectionService(ProjectionRepository(session)).handle(event)

    async def _send_to_dlq(self, raw_value: bytes) -> None:
        from aiokafka import AIOKafkaProducer

        producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
        await producer.start()
        try:
            await producer.send_and_wait(DLQ_TOPIC, value=raw_value)
            logger.info("Sent failed message to DLQ topic=%s", DLQ_TOPIC)
        except Exception:
            logger.exception("Failed to send message to DLQ topic=%s", DLQ_TOPIC)
        finally:
            await producer.stop()

    async def stop(self) -> None:
        if self._consumer is not None:
            with suppress(Exception):
                await self._consumer.stop()
            self._consumer = None
