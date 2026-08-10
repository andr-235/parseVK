"""Content-service outbox publisher background worker."""

import asyncio
import logging
from datetime import UTC, datetime

from common.runtime import WorkerHealth
from prometheus_client import REGISTRY, Gauge

from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.ingestion.ack_transport import ingestion_ack_headers
from app.modules.ingestion.service import ACK_EVENT_TYPE
from app.modules.outbox.publisher import (
    ContentOutboxRepositoryAdapter,
    OutboxPublisher,
    kafka_key_for_event,
)
from app.modules.outbox.repository import OutboxRepository

logger = logging.getLogger(__name__)


def _gauge(name: str, description: str) -> Gauge:
    try:
        return Gauge(name, description)
    except ValueError:
        return REGISTRY._names_to_collectors[name]  # type: ignore[return-value]


_OUTBOX_PENDING = _gauge(
    "content_outbox_pending_events",
    "Number of pending content outbox events",
)
_OUTBOX_OLDEST_AGE = _gauge(
    "content_outbox_oldest_pending_seconds",
    "Age in seconds of the oldest pending content outbox event",
)


def _topic_for(message) -> str:
    if message.event_type == ACK_EVENT_TYPE:
        return settings.kafka_topic_vk_ingestion_ack
    return settings.kafka_topic_content


def _dlq_topic_for(message) -> str:
    if message.event_type == ACK_EVENT_TYPE:
        return settings.kafka_topic_vk_ingestion_dlq
    return settings.kafka_topic_content_dlq


def _normalize_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _observe_outbox(pending: int, oldest_created_at: datetime | None) -> None:
    _OUTBOX_PENDING.set(pending)
    if oldest_created_at is None:
        _OUTBOX_OLDEST_AGE.set(0)
        return
    age = (datetime.now(UTC) - _normalize_utc(oldest_created_at)).total_seconds()
    _OUTBOX_OLDEST_AGE.set(max(age, 0.0))


async def publish_outbox_forever(health: WorkerHealth) -> None:
    from aiokafka import AIOKafkaProducer

    producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
    try:
        await producer.start()
        logger.info("Content outbox worker: Kafka producer started")
    except Exception:
        await producer.stop()
        raise
    try:
        while True:
            try:
                async with SessionLocal() as session:
                    async with session.begin():
                        inner_repository = OutboxRepository(session)
                        repository = ContentOutboxRepositoryAdapter(inner_repository)
                        publisher = OutboxPublisher(
                            repository=repository,
                            producer=producer,
                            topic=settings.kafka_topic_content,
                            dlq_topic=settings.kafka_topic_content_dlq,
                            namespace="content",
                            key_fn=lambda msg: kafka_key_for_event(
                                msg.event_type, msg.payload, msg.aggregate_id
                            ),
                            topic_fn=_topic_for,
                            dlq_topic_fn=_dlq_topic_for,
                            headers_fn=ingestion_ack_headers,
                        )
                        count = await publisher.publish_batch()
                        pending, oldest = await inner_repository.pending_stats()
                        _observe_outbox(pending, oldest)
                        if count:
                            logger.info("Content outbox batch published: %d events", count)
                        health.mark_cycle_success()
            except Exception as error:
                logger.exception("Content outbox batch publish failed")
                health.mark_cycle_error(f"Content outbox batch publish failed: {error}")
            await asyncio.sleep(2)
    finally:
        try:
            await producer.stop()
        except Exception:
            logger.exception("Content outbox worker: producer stop failed")
        else:
            logger.info("Content outbox worker: Kafka producer stopped")
