import asyncio
import logging
import os
import socket

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.services.ingestion.part_publisher import StagedIngestionPartPublisher

logger = logging.getLogger(__name__)


class KafkaIngestionPartTransport:
    def __init__(self, producer) -> None:
        self.producer = producer

    async def send_and_wait(
        self,
        topic: str,
        *,
        value: bytes,
        key: bytes,
        headers: list[tuple[str, bytes]],
    ) -> object:
        return await self.producer.send_and_wait(
            topic,
            value=value,
            key=key,
            headers=headers,
        )


async def publish_staged_parts_forever(
    session_factory: async_sessionmaker,
) -> None:
    from aiokafka import AIOKafkaProducer

    producer = AIOKafkaProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        acks="all",
        enable_idempotence=True,
        max_request_size=settings.staged_part_producer_max_request_bytes,
    )
    await producer.start()
    worker_id = f"{socket.gethostname()}:{os.getpid()}"
    publisher = StagedIngestionPartPublisher(
        session_factory=session_factory,
        transport=KafkaIngestionPartTransport(producer),
        topic=settings.kafka_topic_vk_ingestion,
        worker_id=worker_id,
        batch_size=settings.staged_part_publisher_batch_size,
        lease_seconds=settings.staged_part_publisher_lease_seconds,
        max_attempts=settings.staged_part_publisher_max_attempts,
        retry_base_seconds=settings.staged_part_publisher_retry_base_seconds,
        retry_max_seconds=settings.staged_part_publisher_retry_max_seconds,
    )
    logger.info(
        "staged part publisher started worker=%s topic=%s",
        worker_id,
        settings.kafka_topic_vk_ingestion,
    )
    try:
        while True:
            result = await publisher.publish_once()
            if result.claimed or result.recovered:
                logger.info(
                    "staged part publish cycle recovered=%d claimed=%d "
                    "published=%d retried=%d failed=%d quarantined=%d",
                    result.recovered,
                    result.claimed,
                    result.published,
                    result.retried,
                    result.failed,
                    result.quarantined,
                )
            await asyncio.sleep(settings.staged_part_publisher_poll_seconds)
    finally:
        await producer.stop()
