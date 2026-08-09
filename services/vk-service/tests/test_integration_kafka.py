import asyncio
import json
from uuid import uuid4

import pytest
from _kafka_integration_fixtures import (
    bootstrap_servers as bootstrap_servers,
)
from _kafka_integration_fixtures import topics as topics
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

pytestmark = pytest.mark.integration


@pytest.mark.anyio
async def test_producer_consumer_roundtrip(bootstrap_servers, topics):
    event_id = str(uuid4())
    event = _event(event_id, aggregate_id="-1:42", text="test")

    producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
    await producer.start()
    try:
        await producer.send_and_wait(
            "parsevk.vk.events",
            json.dumps(event).encode(),
            key=event["aggregate_id"].encode(),
        )
    finally:
        await producer.stop()

    consumer = _consumer(
        "parsevk.vk.events",
        bootstrap_servers,
        group_prefix="roundtrip",
    )
    await consumer.start()
    try:
        decoded = await _read_target_event(consumer, event_id)
        assert decoded["event_type"] == "vk.post_collected"
        assert decoded["payload"]["text"] == "test"
        assert decoded["aggregate_id"] == "-1:42"
    finally:
        await consumer.stop()


@pytest.mark.anyio
async def test_dlq_flow(bootstrap_servers, topics):
    event_id = str(uuid4())
    event = _event(event_id, aggregate_id=f"dlq:{event_id}", text="dlq test")
    producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
    await producer.start()
    try:
        await producer.send_and_wait(
            "parsevk.vk.dlq",
            json.dumps({**event, "dlq_reason": "max_retries_exceeded"}).encode(),
            key=event["aggregate_id"].encode(),
        )
    finally:
        await producer.stop()

    consumer = _consumer(
        "parsevk.vk.dlq",
        bootstrap_servers,
        group_prefix="dlq",
    )
    await consumer.start()
    try:
        decoded = await _read_target_event(consumer, event_id)
        assert decoded["dlq_reason"] == "max_retries_exceeded"
    finally:
        await consumer.stop()


@pytest.mark.anyio
async def test_consumer_idempotency(bootstrap_servers, topics):
    event_id = str(uuid4())
    event = _event(
        event_id,
        aggregate_id=f"idempotency-test:{event_id}",
        text="duplicate test",
    )
    producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
    await producer.start()
    try:
        for _ in range(2):
            await producer.send_and_wait(
                "parsevk.vk.events",
                json.dumps(event).encode(),
                key=event["aggregate_id"].encode(),
            )
    finally:
        await producer.stop()

    consumer = _consumer(
        "parsevk.vk.events",
        bootstrap_servers,
        group_prefix="idempotency",
    )
    await consumer.start()
    try:
        matches = await _read_target_occurrences(consumer, event_id, count=2)
        assert {item["event_id"] for item in matches} == {event_id}
    finally:
        await consumer.stop()


def _consumer(topic: str, bootstrap_servers: str, *, group_prefix: str):
    return AIOKafkaConsumer(
        topic,
        bootstrap_servers=bootstrap_servers,
        group_id=f"{group_prefix}-{uuid4()}",
        auto_offset_reset="earliest",
    )


async def _read_target_event(consumer, event_id: str) -> dict:
    return (await _read_target_occurrences(consumer, event_id, count=1))[0]


async def _read_target_occurrences(consumer, event_id: str, *, count: int) -> list[dict]:
    matches: list[dict] = []
    loop = asyncio.get_running_loop()
    deadline = loop.time() + 10
    while len(matches) < count:
        remaining = deadline - loop.time()
        if remaining <= 0:
            raise AssertionError(f"event {event_id} was not observed {count} times")
        msg = await asyncio.wait_for(consumer.getone(), timeout=remaining)
        decoded = json.loads(msg.value.decode())
        if decoded.get("event_id") == event_id:
            matches.append(decoded)
    return matches


def _event(event_id: str, *, aggregate_id: str, text: str) -> dict:
    return {
        "event_id": event_id,
        "event_type": "vk.post_collected",
        "event_version": 1,
        "aggregate_type": "post",
        "aggregate_id": aggregate_id,
        "correlation_id": str(uuid4()),
        "payload": {"text": text},
        "created_at": "2026-06-23T00:00:00+00:00",
    }
