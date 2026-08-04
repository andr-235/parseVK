"""Shared outbox publisher — claim → publish → mark cycle.

Follows the tasks-service pattern: receives an already-started AIOKafkaProducer.
The service worker manages producer lifecycle (create, start, stop).
"""

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


def _create_dlq_counter(namespace: str) -> Counter:
    metric_name = f"{namespace}_dlq_events_total"
    try:
        return Counter(
            metric_name,
            "Total events sent to DLQ",
            ["event_type", "namespace"],
        )
    except ValueError:
        # Re-import in the same process (tests reset sys.modules) — reuse existing collector.
        return REGISTRY._names_to_collectors[metric_name]  # type: ignore[return-value]


class OutboxPublisher:
    """Publishes pending outbox events to Kafka.

    Does NOT manage the Kafka producer lifecycle — the producer is created and
    started by the calling worker. This class handles:
    - Claiming pending events from repository
    - Publishing to Kafka topic
    - Marking published/failed
    - Moving fatally-failed events to dead-letter topic
    """

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
        self.dlq_counter = _create_dlq_counter(namespace)
        logger.debug(
            "OutboxPublisher initialized: topic=%s dlq=%s namespace=%s",
            topic,
            dlq_topic,
            namespace,
        )

    @staticmethod
    def _default_key(msg: OutboxMessage) -> str:
        return msg.aggregate_id

    def _topic_for(self, event: OutboxMessage) -> str:
        return self.topic_fn(event) if self.topic_fn is not None else self.topic

    def _dlq_topic_for(self, event: OutboxMessage) -> str:
        return (
            self.dlq_topic_fn(event)
            if self.dlq_topic_fn is not None
            else self.dlq_topic
        )

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
            created_at=(
                event.created_at.isoformat()
                if event.created_at
                else datetime.now(UTC).isoformat()
            ),
        )
        key = self.key_fn(event)
        topic = self._topic_for(event)
        logger.debug(
            "Publishing event id=%s type=%s topic=%s key=%s",
            event.id,
            event.event_type,
            topic,
            key,
        )
        await self.producer.send_and_wait(
            topic,
            key=key.encode("utf-8"),
            value=wire.model_dump_json().encode("utf-8"),
        )

    async def _publish_to_dlq(
        self, event: OutboxMessage, last_error: str = ""
    ) -> None:
        dlq_reason = (
            f"max_retries_exceeded: {last_error}"
            if last_error
            else "max_retries_exceeded"
        )
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
        self.dlq_counter.labels(
            event_type=event.event_type, namespace=self.namespace
        ).inc()
        key = self.key_fn(event)
        topic = self._dlq_topic_for(event)
        await self.producer.send_and_wait(
            topic,
            key=key.encode("utf-8"),
            value=json.dumps(envelope).encode("utf-8"),
        )
        logger.warning(
            "Moved outbox event id=%s type=%s to DLQ topic=%s after %d attempts (reason: %s)",
            event.id,
            event.event_type,
            topic,
            event.attempts,
            dlq_reason,
        )
