import json

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import OutboxEvent
from app.modules.outbox.repository import OutboxRepository


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
                await self._publish_event(producer, event)
                await self.repository.mark_published(event)
        finally:
            await producer.stop()

        return len(events)

    async def _publish_event(self, producer: AIOKafkaProducer, event: OutboxEvent) -> None:
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
