from typing import Protocol

<<<<<<< HEAD
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import OutboxEvent
from app.modules.outbox.repository import lock_pending_batch, mark_failed_or_retry, mark_published
=======
from app.db.models import OutboxEvent
from app.modules.outbox.repository import lock_pending_batch, mark_failed_or_retry, mark_published
from sqlalchemy.ext.asyncio import AsyncSession
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

IDENTITY_EVENTS_TOPIC = "identity.events"


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
                await mark_failed_or_retry(session, event.id, str(exc))
            else:
                await mark_published(session, event.id)
                published_count += 1
        await session.commit()
        return published_count

    async def _publish_event(self, event: OutboxEvent) -> None:
        await self.producer.send_and_wait(
            self.topic,
            value=_event_value(event),
            key=event.aggregate_id.encode("utf-8"),
        )


def _event_value(event: OutboxEvent) -> bytes:
    return bytes(event.payload if isinstance(event.payload, str) else str(event.payload), "utf-8")
