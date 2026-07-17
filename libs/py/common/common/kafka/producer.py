"""Kafka producer utilities for ParseVK.

Provides shared DLQ producer with bootstrap-server-level producer caching
and metadata header enrichment for observability.
"""

import asyncio
import logging

logger = logging.getLogger(__name__)

_dlq_producers: dict[str, "AIOKafkaProducer"] = {}
_dlq_producers_lock = asyncio.Lock()


async def send_to_dlq(
    raw_value: bytes,
    dlq_topic: str,
    bootstrap_servers: str = "kafka:9092",
    headers: list[tuple[str, bytes]] | None = None,
) -> None:
    from aiokafka import AIOKafkaProducer

    async with _dlq_producers_lock:
        if bootstrap_servers not in _dlq_producers:
            prod = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
            await prod.start()
            _dlq_producers[bootstrap_servers] = prod
            logger.debug("DLQ producer for %s: created", bootstrap_servers)
        else:
            logger.debug("DLQ producer for %s: cached", bootstrap_servers)

    producer = _dlq_producers[bootstrap_servers]
    try:
        kwargs: dict = {"topic": dlq_topic, "value": raw_value}
        if headers:
            kwargs["headers"] = headers
        await producer.send_and_wait(**kwargs)
        logger.info(
            "Sent message to DLQ topic=%s bootstrap=%s headers_count=%d",
            dlq_topic, bootstrap_servers, len(headers) if headers else 0,
        )
    except Exception:
        logger.exception("Failed to send message to DLQ topic=%s", dlq_topic)
