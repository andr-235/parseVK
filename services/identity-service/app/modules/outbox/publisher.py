import json
import logging
from datetime import UTC, datetime
from typing import Protocol

from app.db.models import OutboxEvent
from app.modules.outbox.repository import lock_pending_batch, mark_failed_or_retry, mark_published
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

IDENTITY_EVENTS_TOPIC = "identity.events"
IDENTITY_DLQ_TOPIC = "identity.dlq"


class KafkaProducer(Protocol):
    async def send_and_wait(self, topic: str, value: bytes, key: bytes | None = None): ...


class OutboxPublisher:
    def __init__(self, producer: KafkaProducer, *, topic: str = IDENTITY_EVENTS_TOPIC):
        self.producer = producer
        self.topic = topic

    async def publish_once(self, session: AsyncSession, *, limit: int = 100) -> int:
        events = await lock_pending_batch(session, limit=limit)
        published_count = 0
        for event in events:
            try:
                await self._publish_event(event)
            except Exception as exc:
                logger.warning(
                    "Failed to publish outbox event id=%s type=%s: %s",
                    event.id, event.event_type, exc,
                )
                is_failed = await mark_failed_or_retry(session, event.id, str(exc))
                if is_failed:
                    try:
                        await self._publish_to_dlq(event)
                    except Exception:
                        logger.exception("Failed to send event to DLQ id=%s", event.id)
            else:
                await mark_published(session, event.id)
                published_count += 1
        await session.commit()
        if published_count:
            logger.info("Published %d identity outbox events", published_count)
        return published_count

    async def _publish_event(self, event: OutboxEvent) -> None:
        envelope = {
            "event_id": str(event.id),
            "event_type": event.event_type,
            "event_version": event.event_version,
            "aggregate_type": event.aggregate_type,
            "aggregate_id": event.aggregate_id,
            "correlation_id": event.correlation_id,
            "payload": event.payload,
            "created_at": event.created_at.isoformat() if event.created_at else datetime.now(UTC).isoformat(),
        }
        await self.producer.send_and_wait(
            self.topic,
            value=json.dumps(envelope, default=str).encode("utf-8"),
            key=event.aggregate_id.encode("utf-8"),
        )

    async def _publish_to_dlq(self, event: OutboxEvent) -> None:
        envelope = {
            "event_id": str(event.id),
            "event_type": event.event_type,
            "event_version": event.event_version,
            "aggregate_type": event.aggregate_type,
            "aggregate_id": event.aggregate_id,
            "correlation_id": event.correlation_id,
            "payload": event.payload,
            "created_at": event.created_at.isoformat() if event.created_at else datetime.now(UTC).isoformat(),
            "dlq_reason": "max_retries_exceeded",
        }
        await self.producer.send_and_wait(
            IDENTITY_DLQ_TOPIC,
            value=json.dumps(envelope, default=str).encode("utf-8"),
            key=event.aggregate_id.encode("utf-8"),
        )
        logger.warning(
            "Moved outbox event id=%s type=%s to DLQ after %d attempts",
            event.id, event.event_type, event.attempts,
        )
