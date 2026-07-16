"""Outbox publisher background worker for identity-service."""

import asyncio
import logging

from aiokafka import AIOKafkaProducer
from common.runtime import WorkerHealth

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.modules.outbox.publisher import IDENTITY_EVENTS_TOPIC, OutboxPublisher

logger = logging.getLogger(__name__)


async def publish_outbox_forever(health: WorkerHealth) -> None:
    """Background worker: create producer once, publish outbox events every 2s."""
    producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
    try:
        await producer.start()
        logger.info("Identity outbox worker: Kafka producer started")
    except Exception:
        await producer.stop()
        raise

    try:
        while True:
            try:
                async with AsyncSessionLocal() as session:
                    publisher = OutboxPublisher(producer, topic=IDENTITY_EVENTS_TOPIC)
                    await publisher.publish_once(session)
                health.mark_cycle_success()
            except Exception as e:
                logger.exception("Identity outbox batch publish failed")
                health.mark_cycle_error(f"Identity outbox batch publish failed: {e}")
            await asyncio.sleep(2)
    finally:
        try:
            await producer.stop()
        except Exception:
            logger.exception("Identity outbox worker: producer stop failed")
        else:
            logger.info("Identity outbox worker: Kafka producer stopped")
