"""Shared outbox publisher — claim → publish → mark cycle."""

from __future__ import annotations

import json
import logging
from collections.abc import Callable
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from prometheus_client import REGISTRY, Counter

from common.events import WireEvent
from common.outbox.models import OutboxMessage
from common.outbox.repository import OutboxRepository

if TYPE_CHECKING:
    from aiokafka import AIOKafkaProducer

logger = logging.getLogger(__name__)
HeadersFn = Callable[[OutboxMessage], list[tuple[str, bytes]]]


def _create_dlq_counter(namespace: str) -> Counter:
    metric_name = f"{namespace}_dlq_events_total"
    try:
        return Counter(metric_name, "Total events sent to DLQ", ["event_type", "namespace"])
    except ValueError:
        return REGISTRY._names_to_collectors[metric_name]  # type: ignore[return-value]


class OutboxPublisher:
    def __init__(
        self,
        *,
        repository: OutboxRepository,
        producer: AIOKafkaProducer,
        topic: str,
        dlq_topic: str,
        namespace: str = "default",
        publish_enabled: bool = True,
        key_fn: Callable[[OutboxMessage], str] | None = None,
        topic_fn: Callable[[OutboxMessage], str] | None = None,
        dlq_topic_fn: Callable[[OutboxMessage], str] | None = None,
        headers_fn: HeadersFn | None = None,
    ):
        self.repository = repository
        self.producer = producer
        self.topic = topic
        self.dlq_topic = dlq_topic
        self.publish_enabled = publish_enabled
        self.namespace = namespace
        self.key_fn = key_fn or self._default_key
        self.topic_fn = topic_fn
        self.dlq_topic_fn = dlq_topic_fn
        self.headers_fn = headers_fn
        self.dlq_counter = _create_dlq_counter(namespace)

    @staticmethod
    def _default_key(msg: OutboxMessage) -> str:
        return msg.aggregate_id

    def _topic_for(self, event: OutboxMessage) -> str:
        return self.topic_fn(event) if self.topic_fn is not None else self.topic

    def _dlq_topic_for(self, event: OutboxMessage) -> str:
        return self.dlq_topic_fn(event) if self.dlq_topic_fn is not None else self.dlq_topic

    async def publish_batch(self, limit: int = 100) -> int:
        if not self.publish_enabled:
            return 0
        events = await self.repository.claim_batch(limit=limit)
        if not events:
            return 0
        for event in events:
            try:
                await self._publish_event(event)
            except Exception as exc:
                error = str(exc)
                logger.warning(
                    "Failed to publish event id=%s type=%s: %s",
                    event.id,
                    event.event_type,
                    error,
                )
                is_failed = await self.repository.mark_failed(event.id, error)
                if is_failed:
                    await self._publish_to_dlq(event, error)
                continue
            await self.repository.mark_published(event.id)
        return len(events)

    async def _publish_event(self, event: OutboxMessage) -> None:
        wire = WireEvent(
            event_id=event.id,
            event_type=event.event_type,
            event_version=event.event_version,
            aggregate_type=event.aggregate_type,
            aggregate_id=event.aggregate_id,
            correlation_id=event.correlation_id,
            payload=event.payload,
            created_at=event.created_at.isoformat() if event.created_at else datetime.now(UTC).isoformat(),
        )
        kwargs = {
            "key": self.key_fn(event).encode("utf-8"),
            "value": wire.model_dump_json().encode("utf-8"),
        }
        if self.headers_fn is not None:
            kwargs["headers"] = self.headers_fn(event)
        await self.producer.send_and_wait(self._topic_for(event), **kwargs)

    async def _publish_to_dlq(self, event: OutboxMessage, last_error: str = "") -> None:
        dlq_reason = f"max_retries_exceeded: {last_error}" if last_error else "max_retries_exceeded"
        envelope = {
            "event_id": str(event.id),
            "event_type": event.event_type,
            "event_version": event.event_version,
            "aggregate_type": event.aggregate_type,
            "aggregate_id": event.aggregate_id,
            "correlation_id": event.correlation_id,
            "payload": event.payload,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "dlq_reason": dlq_reason,
            "dlq_timestamp": datetime.now(UTC).isoformat(),
        }
        self.dlq_counter.labels(event_type=event.event_type, namespace=self.namespace).inc()
        kwargs = {
            "key": self.key_fn(event).encode("utf-8"),
            "value": json.dumps(envelope).encode("utf-8"),
        }
        if self.headers_fn is not None:
            kwargs["headers"] = self.headers_fn(event)
        await self.producer.send_and_wait(self._dlq_topic_for(event), **kwargs)
        logger.warning(
            "Moved outbox event id=%s type=%s to DLQ topic=%s after %d attempts",
            event.id,
            event.event_type,
            self._dlq_topic_for(event),
            event.attempts,
        )
