"""Content-service outbox publisher — re-exports the shared OutboxPublisher.

The shared publisher speaks the common OutboxRepository protocol. This module
provides an adapter that bridges the local SQLAlchemy OutboxRepository to that
protocol, plus a Kafka partition key function for content projection events.
"""

from __future__ import annotations

from uuid import UUID

from common.outbox import OutboxMessage, OutboxPublisher
from prometheus_client import REGISTRY, Counter

from app.db.models import ContentOutboxEvent
from app.modules.outbox.repository import MAX_OUTBOX_ATTEMPTS, OutboxRepository

__all__ = [
    "OutboxPublisher",
    "ContentOutboxRepositoryAdapter",
    "kafka_key_for_event",
    "MAX_OUTBOX_ATTEMPTS",
]


def _retry_counter() -> Counter:
    name = "content_outbox_retry_total"
    try:
        return Counter(name, "Content outbox publish retries", ["event_type"])
    except ValueError:
        return REGISTRY._names_to_collectors[name]  # type: ignore[return-value]


_CONTENT_OUTBOX_RETRIES = _retry_counter()


def kafka_key_for_event(event_type: str, payload: dict, aggregate_id: str) -> str:
    """Return Kafka key for a content outbox message.

    Projection events are keyed by aggregate_id (post key) so that consumers
    see events for the same post in order.
    """
    if event_type == "content.comments_projected":
        return str(payload.get("postKey") or aggregate_id)
    return aggregate_id


class ContentOutboxRepositoryAdapter:
    """Adapts content-service OutboxRepository to the common OutboxRepository protocol."""

    def __init__(self, inner: OutboxRepository):
        self._inner = inner

    async def claim_batch(self, limit: int = 100) -> list[OutboxMessage]:
        events = await self._inner.lock_pending(limit=limit)
        return [_to_message(e) for e in events]

    async def mark_published(self, event_id: UUID) -> None:
        event = await self._inner.get(event_id)
        if event is not None:
            await self._inner.mark_published(event)

    async def mark_failed(self, event_id: UUID, error: str) -> bool:
        event = await self._inner.get(event_id)
        if event is None:
            return False
        _CONTENT_OUTBOX_RETRIES.labels(event_type=event.event_type).inc()
        await self._inner.mark_failed(event, error, max_attempts=MAX_OUTBOX_ATTEMPTS)
        return event.attempts >= MAX_OUTBOX_ATTEMPTS


def _to_message(event: ContentOutboxEvent) -> OutboxMessage:
    return OutboxMessage(
        id=event.id,
        event_type=event.event_type,
        event_version=event.event_version,
        aggregate_type=event.aggregate_type,
        aggregate_id=event.aggregate_id,
        correlation_id=event.correlation_id,
        payload=event.payload,
        attempts=event.attempts,
        created_at=event.created_at,
    )
