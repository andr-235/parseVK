import asyncio
import json
import logging
from datetime import UTC, datetime

from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.outbox.repository import OutboxRepository

logger = logging.getLogger(__name__)

IM_DLQ_TOPIC = "parsevk.im.dlq"


class OutboxPublisher:
    def __init__(self, session_factory=None):
        self.session_factory = session_factory or SessionLocal

    async def publish_batch(self, limit: int = 100) -> int:
        if not settings.outbox_publish_enabled:
            return 0

        async with self.session_factory() as session:
            async with session.begin():
                repository = OutboxRepository(session)
                events = await repository.lock_pending_batch(limit=limit)
                if not events:
                    return 0

                from aiokafka import AIOKafkaProducer
                producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
                await producer.start()
                try:
                    for event in events:
                        try:
                            key = str(event.payload.get("taskId") or event.aggregate_id).encode("utf-8")
                            value = json.dumps({
                                "event_id": str(event.id),
                                "event_type": event.event_type,
                                "event_version": event.event_version,
                                "aggregate_type": event.aggregate_type,
                                "aggregate_id": event.aggregate_id,
                                "correlation_id": event.correlation_id,
                                "payload": event.payload,
                                "created_at": event.created_at.isoformat() if event.created_at else datetime.now(UTC).isoformat(),
                            }).encode("utf-8")
                            await producer.send_and_wait(settings.kafka_topic_im, key=key, value=value)
                            await repository.mark_published(event)
                        except Exception:
                            logger.exception(
                                "Failed to publish IM outbox event id=%s type=%s",
                                event.id,
                                event.event_type,
                            )
                            is_failed = await repository.mark_failed_or_retry(event.id, "publish_error")
                        if is_failed:
                            dlq_value = json.dumps({
                                "event_id": str(event.id),
                                "event_type": event.event_type,
                                "event_version": event.event_version,
                                "aggregate_type": event.aggregate_type,
                                "aggregate_id": event.aggregate_id,
                                "correlation_id": event.correlation_id,
                                "payload": event.payload,
                                "created_at": event.created_at.isoformat() if event.created_at else datetime.now(UTC).isoformat(),
                                "dlq_reason": "max_retries_exceeded",
                            }).encode("utf-8")
                            dlq_key = str(event.payload.get("taskId") or event.aggregate_id).encode("utf-8")
                            await producer.send_and_wait(IM_DLQ_TOPIC, key=dlq_key, value=dlq_value)
                            logger.warning(
                                "Moved IM outbox event id=%s type=%s to DLQ after %d attempts",
                                event.id, event.event_type, event.attempts,
                            )
                finally:
                    await producer.stop()

            return len(events)


async def publish_outbox_forever():
    publisher = OutboxPublisher()
    while True:
        try:
            published = await publisher.publish_batch()
            if published:
                logger.info("Published %d outbox events to %s", published, settings.kafka_topic_im)
        except Exception:
            logger.exception("Outbox publish error")
        await asyncio.sleep(2)
