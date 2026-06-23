import asyncio
import json
import logging

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from app.core.config import settings
from app.db.session import async_session_maker
from app.modules.moderation.schemas import VkEvent
from app.modules.moderation.service import ModerationService
from prometheus_client import Gauge

logger = logging.getLogger(__name__)

DLQ_TOPIC = "parsevk.vk.dlq"
MAX_CONSUMER_RETRIES = 3

try:
    _consumer_lag = Gauge(
        "kafka_consumer_lag",
        "Consumer lag per partition",
        ["topic", "consumer_group", "partition"],
    )
except ValueError:
    from prometheus_client.registry import REGISTRY

    _consumer_lag = REGISTRY._names_to_collectors["kafka_consumer_lag"]


class ProjectionConsumer:
    def __init__(self):
        self.consumer = None
        self._retry_count: dict[str, int] = {}

    async def start(self):
        self.consumer = AIOKafkaConsumer(
            settings.kafka_topic_vk,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id="moderation-service-group",
            auto_offset_reset="earliest",
            enable_auto_commit=False,
        )
        await self.consumer.start()
        logger.info(
            "Moderation Kafka consumer started topic=%s group=%s",
            settings.kafka_topic_vk,
            "moderation-service-group",
        )

    async def stop(self):
        if self.consumer:
            await self.consumer.stop()
            logger.info("Moderation Kafka consumer stopped")

    async def run_forever(self):
        await self.start()
        try:
            async for msg in self.consumer:
                event_id = None
                event_type = None
                correlation_id = None
                try:
                    payload = json.loads(msg.value.decode("utf-8"))
                    event = VkEvent.model_validate(payload)
                    if event.event_version != 1:
                        logger.warning(
                            "Skipping unsupported event version %d for type %s at offset %s",
                            event.event_version, event.event_type, msg.offset,
                        )
                        await self.consumer.commit()
                        continue
                    event_id = event.event_id
                    event_type = event.event_type
                    correlation_id = event.correlation_id
                    logger.debug(
                        "Moderation Kafka message received event_id=%s type=%s offset=%s",
                        event.event_id,
                        event.event_type,
                        msg.offset,
                    )
                    async with async_session_maker() as session:
                        service = ModerationService(session, session_maker=async_session_maker)
                        await service.handle_event(event)
                    await self.consumer.commit()
                except Exception as e:
                    message_key = f"{msg.partition}:{msg.offset}"
                    retries = self._retry_count.get(message_key, 0) + 1
                    self._retry_count[message_key] = retries
                    if retries >= MAX_CONSUMER_RETRIES:
                        logger.exception(
                            "Error processing moderation Kafka message offset=%s after %d retries, sending to DLQ; event_id=%s type=%s",
                            msg.offset, retries, event_id, event_type,
                            exc_info=e,
                        )
                        await self._send_to_dlq(msg.value)
                        self._retry_count.pop(message_key, None)
                        await self.consumer.commit()
                    else:
                        logger.exception(
                            "Error processing moderation Kafka message offset=%s (retry %d/%d); event_id=%s type=%s",
                            msg.offset, retries, MAX_CONSUMER_RETRIES,
                            event_id, event_type,
                            exc_info=e,
                        )
                self._update_lag_metric(msg)
        except asyncio.CancelledError:
            pass

    def _update_lag_metric(self, msg) -> None:
        try:
            lag = msg.highwater_mark - msg.offset - 1 if msg.highwater_mark is not None else 0
            _consumer_lag.labels(
                topic=msg.topic,
                consumer_group="moderation-service-group",
                partition=str(msg.partition),
            ).set(max(lag, 0))
        except Exception:
            pass

    async def _send_to_dlq(self, raw_value: bytes) -> None:
        producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
        await producer.start()
        try:
            await producer.send_and_wait(DLQ_TOPIC, value=raw_value)
            logger.info("Sent failed moderation message to DLQ topic=%s", DLQ_TOPIC)
        except Exception:
            logger.exception("Failed to send message to DLQ topic=%s", DLQ_TOPIC)
        finally:
            await producer.stop()
