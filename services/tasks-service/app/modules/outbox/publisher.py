import json
import logging
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import OutboxEvent
from app.modules.outbox.repository import OutboxRepository

if TYPE_CHECKING:
    from aiokafka import AIOKafkaProducer

logger = logging.getLogger(__name__)

MAX_OUTBOX_ATTEMPTS = 5


def kafka_key_for_event(event_type: str, payload: dict, aggregate_id: str) -> str:
    if event_type == "task.automation_settings_updated":
        return str(payload["ownerUserId"])
    return str(payload.get("taskId") or aggregate_id)


class OutboxPublisher:
    def __init__(self, session: AsyncSession):
        self.repository = OutboxRepository(session)

    async def publish_batch(self, limit: int = 100) -> int:
        if not settings.outbox_publish_enabled:
            return 0

        events = await self.repository.lock_pending(limit)
        if not events:
            return 0

        from aiokafka import AIOKafkaProducer

        producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
        await producer.start()
        try:
            for event in events:
                try:
                    await self._publish_event(producer, event)
                except Exception as exc:
                    error = str(exc)
                    logger.warning("Failed to publish event id=%s type=%s: %s", event.id, event.event_type, error)
                    await self.repository.mark_failed(event, error, max_attempts=MAX_OUTBOX_ATTEMPTS)
                    if event.attempts >= MAX_OUTBOX_ATTEMPTS:
                        await self._publish_to_dlq(producer, event)
                    continue
                await self.repository.mark_published(event)
        finally:
            await producer.stop()

        return len(events)

    async def _publish_event(self, producer: "AIOKafkaProducer", event: OutboxEvent) -> None:
        key = kafka_key_for_event(event.event_type, event.payload, event.aggregate_id)
        await producer.send_and_wait(
            settings.kafka_topic_tasks,
            key=key.encode("utf-8"),
            value=json.dumps(
                {
                    "event_id": str(event.id),
                    "event_type": event.event_type,
                    "event_version": event.event_version,
                    "aggregate_type": event.aggregate_type,
                    "aggregate_id": event.aggregate_id,
                    "correlation_id": event.correlation_id,
                    "payload": event.payload,
                    "created_at": event.created_at.isoformat(),
                }
            ).encode("utf-8"),
        )

    async def _publish_to_dlq(self, producer: "AIOKafkaProducer", event: OutboxEvent) -> None:
        envelope = {
            "event_id": str(event.id),
            "event_type": event.event_type,
            "event_version": event.event_version,
            "aggregate_type": event.aggregate_type,
            "aggregate_id": event.aggregate_id,
            "correlation_id": event.correlation_id,
            "payload": event.payload,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "dlq_reason": "max_retries_exceeded",
        }
        key = kafka_key_for_event(event.event_type, event.payload, event.aggregate_id)
        await producer.send_and_wait(
            settings.kafka_topic_tasks_dlq,
            key=key.encode("utf-8"),
            value=json.dumps(envelope).encode("utf-8"),
        )
        logger.warning(
            "Moved outbox event id=%s type=%s to DLQ after %d attempts",
            event.id, event.event_type, event.attempts,
        )
