import asyncio
import logging
import os
import socket

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.services.ingestion.kafka_topology import verify_staged_ingestion_topology
from app.services.ingestion.part_publisher import StagedIngestionPartPublisher

logger = logging.getLogger(__name__)

TOPOLOGY_RECHECK_SECONDS = 30.0


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
    *,
    health_flag: list[bool] | None = None,
) -> None:
    from aiokafka import AIOKafkaProducer

    _set_health(health_flag, False)
    producer = AIOKafkaProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        acks="all",
        enable_idempotence=True,
        max_request_size=settings.staged_part_producer_max_request_bytes,
    )
    started = False
    try:
        await producer.start()
        started = True
        publisher = _build_publisher(session_factory, producer)
        next_topology_check = 0.0
        logger.info(
            "staged part publisher started worker=%s topic=%s",
            publisher.worker_id,
            settings.kafka_topic_vk_ingestion,
        )

        while True:
            loop_time = asyncio.get_running_loop().time()
            if loop_time >= next_topology_check or not _is_healthy(health_flag):
                _set_health(health_flag, False)
                await _verify_topology()
                _set_health(health_flag, True)
                next_topology_check = loop_time + TOPOLOGY_RECHECK_SECONDS

            result = await publisher.publish_once()
            if result.retried or result.failed:
                _set_health(health_flag, False)
                next_topology_check = 0.0
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
        _set_health(health_flag, False)
        if started:
            await producer.stop()


def _build_publisher(
    session_factory: async_sessionmaker,
    producer,
) -> StagedIngestionPartPublisher:
    worker_id = f"{socket.gethostname()}:{os.getpid()}"
    return StagedIngestionPartPublisher(
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


async def _verify_topology() -> None:
    await verify_staged_ingestion_topology(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        topic=settings.kafka_topic_vk_ingestion,
        dlq_topic=settings.kafka_topic_vk_ingestion_dlq,
        min_message_bytes=settings.staged_part_producer_max_request_bytes,
    )


def _set_health(health_flag: list[bool] | None, healthy: bool) -> None:
    if health_flag is not None:
        health_flag[0] = healthy


def _is_healthy(health_flag: list[bool] | None) -> bool:
    return health_flag is None or health_flag[0]
