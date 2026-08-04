"""Outbox publisher background worker for tasks-service.

Creates a single long-lived Kafka producer at startup and uses it for all
outbox publish cycles. Canonical VK command topics are provisioned
idempotently before publication begins.
"""

import asyncio
import logging
from collections.abc import Awaitable, Callable

from aiokafka import AIOKafkaProducer
from aiokafka.admin import AIOKafkaAdminClient, NewTopic
from aiokafka.errors import TopicAlreadyExistsError
from common.runtime import WorkerHealth

from app.bootstrap import ApplicationFactory
from app.core.config import settings
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

TopicProvisioner = Callable[[], Awaitable[None]]


async def ensure_vk_command_topics() -> None:
    """Create command and DLQ topics when canonical publishing is enabled."""
    if not settings.vk_commands_publish_enabled:
        return

    admin = AIOKafkaAdminClient(
        bootstrap_servers=settings.kafka_bootstrap_servers
    )
    await admin.start()
    try:
        existing = await admin.list_topics()
        requested = (
            settings.kafka_topic_vk_commands,
            settings.kafka_topic_vk_commands_dlq,
        )
        missing = [topic for topic in requested if topic not in existing]
        if not missing:
            return
        try:
            await admin.create_topics(
                [
                    NewTopic(
                        name=topic,
                        num_partitions=3,
                        replication_factor=1,
                    )
                    for topic in missing
                ]
            )
        except TopicAlreadyExistsError:
            # Another replica or kafka-init may win the same idempotent race.
            pass
        logger.info(
            "Ensured canonical VK command topics: %s",
            ", ".join(missing),
        )
    finally:
        await admin.close()


async def publish_outbox_forever(
    health: WorkerHealth,
    *,
    topic_provisioner: TopicProvisioner | None = None,
) -> None:
    """Create one producer and publish outbox events every two seconds."""
    if topic_provisioner is not None:
        await topic_provisioner()
    producer = AIOKafkaProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers
    )
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
                        factory = ApplicationFactory(
                            session,
                            producer=producer,
                        )
                        publisher = factory.create_outbox_publisher()
                        count = await publisher.publish_batch()
                        if count:
                            logger.info(
                                "Outbox batch published: %d events",
                                count,
                            )
                        health.mark_cycle_success()
            except Exception as exc:
                logger.exception("Outbox batch publish failed")
                health.mark_cycle_error(
                    f"Outbox batch publish failed: {exc}"
                )
            await asyncio.sleep(2)
    finally:
        try:
            await producer.stop()
        except Exception:
            logger.exception("Outbox worker: producer stop failed")
        else:
            logger.info("Outbox worker: Kafka producer stopped")
