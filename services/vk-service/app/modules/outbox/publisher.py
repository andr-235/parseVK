import asyncio
import json
import logging
from datetime import datetime
from uuid import UUID

from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.outbox.repository import OutboxRepository

logger = logging.getLogger(__name__)


def json_default(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def kafka_key_for_event(event_type: str, payload: dict, aggregate_id: str) -> str:
    if event_type in {"vk.task_progress_updated", "vk.task_completed", "vk.task_failed"}:
        return str(payload["taskId"])
    return str(aggregate_id)


class OutboxPublisher:
    def __init__(self, repository, *, topic: str | None = None):
        self.repository = repository
        self.topic = topic or settings.kafka_topic_vk
        self._producer = None

    async def publish_pending(self, *, limit: int = 100) -> int:
        from aiokafka import AIOKafkaProducer

        if self._producer is None:
            self._producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
            await self._producer.start()

        count = 0
        for event in await self.repository.list_pending(limit=limit):
            envelope = {
                "event_id": str(event.id),
                "event_type": event.event_type,
                "event_version": event.event_version,
                "aggregate_type": event.aggregate_type,
                "aggregate_id": event.aggregate_id,
                "correlation_id": event.correlation_id,
                "payload": event.payload,
                "created_at": event.created_at.isoformat(),
            }
            key = kafka_key_for_event(event.event_type, event.payload, event.aggregate_id)
            await self._producer.send_and_wait(
                self.topic,
                key=key.encode("utf-8"),
                value=json.dumps(envelope, default=json_default).encode("utf-8"),
            )
            await self.repository.mark_published(event)
            count += 1
        return count

    async def stop(self) -> None:
        if self._producer is not None:
            await self._producer.stop()
            self._producer = None


async def publish_outbox_forever() -> None:
    while True:
        try:
            async with SessionLocal() as session:
                async with session.begin():
                    publisher = OutboxPublisher(OutboxRepository(session))
                    try:
                        await publisher.publish_pending()
                    finally:
                        await publisher.stop()
        except Exception:
            logger.exception("vk outbox publish loop failed")
        await asyncio.sleep(2)
