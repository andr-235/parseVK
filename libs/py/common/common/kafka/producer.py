"""Kafka producer utilities for ParseVK.

Provides shared DLQ producer with bootstrap-server-level producer caching
and metadata header enrichment for observability.
"""

import asyncio
import logging
from typing import Any

logger = logging.getLogger(__name__)

AIOKafkaProducer: Any = None
_dlq_producers: dict[str, Any] = {}
_dlq_producers_lock = asyncio.Lock()


async def send_to_dlq(
    raw_value: bytes,
    dlq_topic: str,
    bootstrap_servers: str = "kafka:9092",
    headers: list[tuple[str, bytes]] | None = None,
) -> None:
    global AIOKafkaProducer

    async with _dlq_producers_lock:
        if bootstrap_servers not in _dlq_producers:
            producer_class = AIOKafkaProducer
            if producer_class is None:
                from aiokafka import AIOKafkaProducer as imported_producer_class

                AIOKafkaProducer = imported_producer_class
                producer_class = imported_producer_class

            producer = producer_class(bootstrap_servers=bootstrap_servers)
            await producer.start()
            _dlq_producers[bootstrap_servers] = producer
            logger.debug("DLQ producer for %s: created", bootstrap_servers)
        else:
            logger.debug("DLQ producer for %s: cached", bootstrap_servers)

    producer = _dlq_producers[bootstrap_servers]
    try:
        kwargs: dict[str, Any] = {"topic": dlq_topic, "value": raw_value}
        if headers:
            kwargs["headers"] = headers
        await producer.send_and_wait(**kwargs)
        logger.info(
            "Sent message to DLQ topic=%s bootstrap=%s headers_count=%d",
            dlq_topic,
            bootstrap_servers,
            len(headers) if headers else 0,
        )
    except Exception:
        logger.exception("Failed to send message to DLQ topic=%s", dlq_topic)
