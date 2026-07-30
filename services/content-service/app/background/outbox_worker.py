"""Content-service outbox publisher background worker.

Creates a single long-lived Kafka producer at startup and uses it for all
outbox publish cycles. On worker crash the supervisor restarts the worker,
which creates a fresh producer.
"""

import asyncio
import logging

from common.runtime import WorkerHealth

from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.outbox.publisher import (
    ContentOutboxRepositoryAdapter,
    OutboxPublisher,
    kafka_key_for_event,
)
from app.modules.outbox.repository import OutboxRepository

logger = logging.getLogger(__name__)


async def publish_outbox_forever(health: WorkerHealth) -> None:
    """Background worker: create producer once, publish outbox events every 2s."""
    from aiokafka import AIOKafkaProducer

    producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
    try:
        await producer.start()
        logger.info("Content outbox worker: Kafka producer started")
    except Exception:
        await producer.stop()
        raise

    try:
        while True:
            try:
                async with SessionLocal() as session:
                    async with session.begin():
                        repository = ContentOutboxRepositoryAdapter(OutboxRepository(session))
                        publisher = OutboxPublisher(
                            repository=repository,
                            producer=producer,
                            topic=settings.kafka_topic_content,
                            dlq_topic=settings.kafka_topic_content_dlq,
                            namespace="content",
                            key_fn=lambda msg: kafka_key_for_event(
                                msg.event_type, msg.payload, msg.aggregate_id
                            ),
                        )
                        count = await publisher.publish_batch()
                        if count:
                            logger.info("Content outbox batch published: %d events", count)
                        health.mark_cycle_success()
            except Exception as e:
                logger.exception("Content outbox batch publish failed")
                health.mark_cycle_error(f"Content outbox batch publish failed: {e}")
            await asyncio.sleep(2)
    finally:
        try:
            await producer.stop()
        except Exception:
            logger.exception("Content outbox worker: producer stop failed")
        else:
            logger.info("Content outbox worker: Kafka producer stopped")
