import json
import logging
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from common.events import WireEvent
from prometheus_client import REGISTRY, Counter

from app.db.models import OutboxEvent
from app.modules.outbox.repository import OutboxRepository

if TYPE_CHECKING:
    from aiokafka import AIOKafkaProducer

logger = logging.getLogger(__name__)


def _create_dlq_counter() -> Counter:
    try:
        return Counter(
            "tasks_dlq_events_total",
            "Total events sent to tasks DLQ",
            ["event_type"],
        )
    except ValueError:
        # Re-import in the same process (tests reset sys.modules) — reuse existing collector.
        return REGISTRY._names_to_collectors["tasks_dlq_events_total"]


dlq_events_total = _create_dlq_counter()

MAX_OUTBOX_ATTEMPTS = 5


def kafka_key_for_event(event_type: str, payload: dict, aggregate_id: str) -> str:
    if event_type == "task.automation_settings_updated":
        return str(payload["ownerUserId"])
    return str(payload.get("taskId") or aggregate_id)


class OutboxPublisher:
    """Publishes pending outbox events to Kafka using a pre-configured producer.

    Does NOT manage the Kafka producer lifecycle — the producer is created and
    started by the OutboxWorker (or provided in tests). This class is responsible
    only for reading pending events, publishing them, handling retries, and
    moving fatally-failed events to the dead-letter queue.
    """

    def __init__(
        self,
        *,
        repository: OutboxRepository,
        producer: "AIOKafkaProducer",
        topic: str,
        dlq_topic: str,
        publish_enabled: bool = True,
    ):
        self.repository = repository
        self.producer = producer
        self.topic = topic
        self.dlq_topic = dlq_topic
        self.publish_enabled = publish_enabled
        logger.debug("OutboxPublisher initialized with explicit producer and topics")

    async def publish_batch(self, limit: int = 100) -> int:
        if not self.publish_enabled:
            return 0

        events = await self.repository.lock_pending(limit)
        if not events:
            return 0

        for event in events:
            try:
                await self._publish_event(event)
            except Exception as exc:
                error = str(exc)
                logger.warning("Failed to publish event id=%s type=%s: %s", event.id, event.event_type, error)
                await self.repository.mark_failed(event, error, max_attempts=MAX_OUTBOX_ATTEMPTS)
                if event.attempts >= MAX_OUTBOX_ATTEMPTS:
                    await self._publish_to_dlq(event, error)
                continue
            await self.repository.mark_published(event)

        return len(events)

    async def _publish_event(self, event: OutboxEvent) -> None:
        wire = WireEvent(
            event_id=event.id,
            event_type=event.event_type,
            event_version=event.event_version,
            aggregate_type=event.aggregate_type,
            aggregate_id=event.aggregate_id,
            correlation_id=event.correlation_id,
            payload=event.payload,
            created_at=event.created_at.isoformat(),
        )
        key = kafka_key_for_event(event.event_type, event.payload, event.aggregate_id)
        logger.debug("Publishing event id=%s type=%s via WireEvent", event.id, event.event_type)
        await self.producer.send_and_wait(
            self.topic,
            key=key.encode("utf-8"),
            value=wire.model_dump_json().encode("utf-8"),
        )

    async def _publish_to_dlq(self, event: OutboxEvent, last_error: str = "") -> None:
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
        dlq_events_total.labels(event_type=event.event_type).inc()
        key = kafka_key_for_event(event.event_type, event.payload, event.aggregate_id)
        await self.producer.send_and_wait(
            self.dlq_topic,
            key=key.encode("utf-8"),
            value=json.dumps(envelope).encode("utf-8"),
        )
        logger.warning(
            "Moved outbox event id=%s type=%s to DLQ after %d attempts (reason: %s)",
            event.id, event.event_type, event.attempts, dlq_reason,
        )
