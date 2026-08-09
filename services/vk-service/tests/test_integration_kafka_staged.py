import asyncio
from uuid import uuid4

import pytest
from _kafka_integration_fixtures import (
    APPLICATION_HARD_LIMIT_BYTES,
    bootstrap_servers as bootstrap_servers,
    INGESTION_DLQ_TOPIC,
    INGESTION_TOPIC,
    TRANSPORT_LIMIT_BYTES,
)
from _kafka_integration_fixtures import topics as topics
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from app.services.ingestion.kafka_topology import verify_staged_ingestion_topology

pytestmark = pytest.mark.integration


@pytest.mark.anyio
async def test_staged_ingestion_topology_accepts_real_broker_limits(
    bootstrap_servers,
    topics,
):
    await verify_staged_ingestion_topology(
        bootstrap_servers=bootstrap_servers,
        topic=INGESTION_TOPIC,
        dlq_topic=INGESTION_DLQ_TOPIC,
        min_message_bytes=TRANSPORT_LIMIT_BYTES,
    )


@pytest.mark.anyio
async def test_staged_ingestion_max_application_event_reaches_broker(
    bootstrap_servers,
    topics,
):
    event_id = str(uuid4())
    batch_id = str(uuid4())
    key = f"-12345:{uuid4()}".encode()
    headers = [
        ("event-id", event_id.encode()),
        ("event-type", b"vk.ingestion.comment-part-prepared"),
        ("batch-id", batch_id.encode()),
        ("wire-digest", b"a" * 64),
    ]
    value = b"x" * APPLICATION_HARD_LIMIT_BYTES

    producer = AIOKafkaProducer(
        bootstrap_servers=bootstrap_servers,
        acks="all",
        enable_idempotence=True,
        max_request_size=TRANSPORT_LIMIT_BYTES,
    )
    await producer.start()
    try:
        await producer.send_and_wait(
            INGESTION_TOPIC,
            value=value,
            key=key,
            headers=headers,
        )
    finally:
        await producer.stop()

    consumer = AIOKafkaConsumer(
        INGESTION_TOPIC,
        bootstrap_servers=bootstrap_servers,
        group_id=f"staged-max-size-{uuid4()}",
        auto_offset_reset="earliest",
        max_partition_fetch_bytes=TRANSPORT_LIMIT_BYTES,
        fetch_max_bytes=TRANSPORT_LIMIT_BYTES,
    )
    await consumer.start()
    try:
        msg = await _read_by_key(consumer, key)
        assert msg.headers == tuple(headers)
        assert msg.value == value
    finally:
        await consumer.stop()


async def _read_by_key(consumer, key: bytes):
    loop = asyncio.get_running_loop()
    deadline = loop.time() + 10
    while True:
        remaining = deadline - loop.time()
        if remaining <= 0:
            raise AssertionError("staged max-size event was not observed")
        msg = await asyncio.wait_for(consumer.getone(), timeout=remaining)
        if msg.key == key:
            return msg
