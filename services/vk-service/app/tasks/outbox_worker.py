import asyncio
import logging
from uuid import UUID

from common.outbox import OutboxPublisher
from common.outbox.models import OutboxMessage
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.infrastructure.db.repositories.outbox import SqlAlchemyOutboxRepository

logger = logging.getLogger(__name__)

VK_DLQ_TOPIC = "parsevk.vk.dlq"


class VkOutboxRepositoryAdapter:
    """Adapts vk-service SqlAlchemyOutboxRepository to common OutboxRepository protocol."""

    def __init__(self, inner: SqlAlchemyOutboxRepository):
        self._inner = inner

    async def claim_batch(self, limit: int = 100) -> list[OutboxMessage]:
        entities = await self._inner.lock_pending_batch(limit=limit)
        return [
            OutboxMessage(
                id=e.id,
                event_type=e.event_type,
                event_version=e.event_version,
                aggregate_type=e.aggregate_type,
                aggregate_id=e.aggregate_id,
                correlation_id=e.correlation_id,
                payload=e.payload,
                attempts=e.attempts,
                created_at=e.created_at,
            )
            for e in entities
        ]

    async def mark_published(self, event_id: UUID) -> None:
        await self._inner.mark_published(event_id)

    async def mark_failed(self, event_id: UUID, error: str) -> bool:
        return await self._inner.mark_failed_or_retry(event_id, error)


async def publish_outbox_forever(session_factory: async_sessionmaker) -> None:
    from aiokafka import AIOKafkaProducer

    logger.info("VK outbox publisher starting (shared)")
    producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
    await producer.start()
    try:
        while True:
            try:
                async with session_factory() as session:
                    async with session.begin():
                        repo = VkOutboxRepositoryAdapter(SqlAlchemyOutboxRepository(session))
                        publisher = OutboxPublisher(
                            repository=repo,
                            producer=producer,
                            topic=settings.kafka_topic_vk,
                            dlq_topic=VK_DLQ_TOPIC,
                            namespace="vk",
                            key_fn=lambda msg: (
                                str(msg.payload.get("taskId", msg.aggregate_id))
                                if msg.event_type
                                in {"vk.task_progress_updated", "vk.task_completed", "vk.task_failed"}
                                else msg.aggregate_id
                            ),
                        )
                        await publisher.publish_batch()
            except Exception:
                logger.exception("vk outbox publish loop failed")
            await asyncio.sleep(2)
    finally:
        await producer.stop()
