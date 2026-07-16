"""Outbox publisher background worker for tasks-service.

Creates a single long-lived Kafka producer at startup and uses it for
all outbox publish cycles. On worker crash the supervisor restarts the
worker, which creates a fresh producer.
"""

import asyncio
import logging

from aiokafka import AIOKafkaProducer
from common.runtime import WorkerHealth

from app.bootstrap import ApplicationFactory
from app.core.config import settings
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


async def publish_outbox_forever(health: WorkerHealth) -> None:
    """Background worker: create producer once, publish outbox events every 2s."""
    producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
    try:
        await producer.start()
        logger.info("Outbox worker: Kafka producer started")
    except Exception:
        await producer.stop()
        raise

    try:
        while True:
            try:
                async with SessionLocal() as session:
                    async with session.begin():
                        factory = ApplicationFactory(session, producer=producer)
                        publisher = factory.create_outbox_publisher()
                        count = await publisher.publish_batch()
                        if count:
                            logger.info("Outbox batch published: %d events", count)
                        health.mark_cycle_success()
            except Exception as e:
                logger.exception("Outbox batch publish failed")
                health.mark_cycle_error(f"Outbox batch publish failed: {e}")
            await asyncio.sleep(2)
    finally:
        try:
            await producer.stop()
        except Exception:
            logger.exception("Outbox worker: producer stop failed")
        else:
            logger.info("Outbox worker: Kafka producer stopped")
