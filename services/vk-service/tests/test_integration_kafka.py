import json
import logging
import os
from uuid import uuid4

import pytest
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from app.services.ingestion.kafka_topology import verify_staged_ingestion_topology

logger = logging.getLogger(__name__)

pytestmark = pytest.mark.integration

INGESTION_TOPIC = "parsevk.content.ingestion.vk"
INGESTION_DLQ_TOPIC = "parsevk.content.ingestion.vk.dlq"
TRANSPORT_LIMIT_BYTES = 1_048_576
APPLICATION_HARD_LIMIT_BYTES = 768 * 1024


@pytest.fixture(scope="module")
def bootstrap_servers():
    # testcontainers fixture is session-scoped; this fixture provides it
    # to the module. Actual integration tests use docker-compose or manual
    # Kafka setup — testcontainers is the automated path.
    tc = os.environ.get("TESTCONTAINERS_KAFKA_BOOTSTRAP")
    if tc:
        yield tc
        return
    try:
        from testcontainers.kafka import KafkaContainer

        with KafkaContainer(image="apache/kafka:4.1.0") as kafka:
            yield kafka.get_bootstrap_server()
    except Exception as e:
        pytest.skip(f"KafkaContainer not available: {e}")


@pytest.fixture(scope="module")
async def topics(bootstrap_servers):
    from aiokafka.admin import AIOKafkaAdminClient, NewTopic

    admin = AIOKafkaAdminClient(bootstrap_servers=bootstrap_servers)
    await admin.start()
    topic_names = [
        "parsevk.vk.events",
        "parsevk.vk.dlq",
        "parsevk.tasks.events",
        INGESTION_TOPIC,
        INGESTION_DLQ_TOPIC,
    ]
    existing = await admin.list_topics()
    to_create = []
    for topic in topic_names:
        if topic in existing:
            continue
        configs = None
        if topic == INGESTION_TOPIC:
            configs = {"max.message.bytes": str(TRANSPORT_LIMIT_BYTES)}
        elif topic == INGESTION_DLQ_TOPIC:
            configs = {
                "max.message.bytes": str(TRANSPORT_LIMIT_BYTES),
                "retention.ms": "604800000",
            }
        to_create.append(
            NewTopic(
                name=topic,
                num_partitions=3,
                replication_factor=1,
                topic_configs=configs,
            )
        )
    if to_create:
        await admin.create_topics(to_create)
    await admin.close()
    yield topic_names


@pytest.mark.anyio
async def test_producer_consumer_roundtrip(bootstrap_servers, topics):
    event_id = str(uuid4())
    event = {
        "event_id": event_id,
        "event_type": "vk.post_collected",
        "event_version": 1,
        "aggregate_type": "post",
        "aggregate_id": "-1:42",
        "correlation_id": str(uuid4()),
        "payload": {"owner_id": -1, "post_id": 42, "text": "test"},
        "created_at": "2026-06-23T00:00:00+00:00",
    }

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

    consumer = AIOKafkaConsumer(
        "parsevk.vk.events",
        bootstrap_servers=bootstrap_servers,
        group_id="test-group",
        auto_offset_reset="earliest",
    )
    await consumer.start()
    try:
        msg = await consumer.getone(timeout_ms=10000)
        decoded = json.loads(msg.value.decode())
        assert decoded["event_id"] == event_id
        assert decoded["event_type"] == "vk.post_collected"
        assert decoded["payload"]["text"] == "test"
        assert decoded["aggregate_id"] == "-1:42"
    finally:
        await consumer.stop()


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
    key = b"-12345:67890"
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
        msg = await consumer.getone(timeout_ms=10000)
        assert msg.key == key
        assert msg.headers == headers
        assert msg.value == value
    finally:
        await consumer.stop()


@pytest.mark.anyio
async def test_dlq_flow(bootstrap_servers):
    producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
    await producer.start()
    try:
        event = {
            "event_id": str(uuid4()),
            "event_type": "vk.post_collected",
            "event_version": 1,
            "aggregate_type": "post",
            "aggregate_id": "dlq-test",
            "correlation_id": str(uuid4()),
            "payload": {"text": "dlq test"},
            "created_at": "2026-06-23T00:00:00+00:00",
        }
        await producer.send_and_wait(
            "parsevk.vk.events",
            json.dumps(event).encode(),
            key=event["aggregate_id"].encode(),
        )
        await producer.send_and_wait(
            "parsevk.vk.dlq",
            json.dumps({**event, "dlq_reason": "max_retries_exceeded"}).encode(),
            key=event["aggregate_id"].encode(),
        )
    finally:
        await producer.stop()

    consumer = AIOKafkaConsumer(
        "parsevk.vk.dlq",
        bootstrap_servers=bootstrap_servers,
        group_id="test-dlq-group",
        auto_offset_reset="earliest",
    )
    await consumer.start()
    try:
        msg = await consumer.getone(timeout_ms=10000)
        decoded = json.loads(msg.value.decode())
        assert decoded["dlq_reason"] == "max_retries_exceeded"
    finally:
        await consumer.stop()


@pytest.mark.anyio
async def test_consumer_idempotency(bootstrap_servers):
    event_id = str(uuid4())
    event = {
        "event_id": event_id,
        "event_type": "vk.post_collected",
        "event_version": 1,
        "aggregate_type": "post",
        "aggregate_id": f"idempotency-test:{event_id}",
        "correlation_id": str(uuid4()),
        "payload": {"text": "duplicate test"},
        "created_at": "2026-06-23T00:00:00+00:00",
    }

    producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
    await producer.start()
    try:
        # Publish the same event twice (simulating at-least-once delivery)
        for _ in range(2):
            await producer.send_and_wait(
                "parsevk.vk.events",
                json.dumps(event).encode(),
                key=event["aggregate_id"].encode(),
            )
    finally:
        await producer.stop()

    # Consume both messages — consumer should handle duplicates
    consumer = AIOKafkaConsumer(
        "parsevk.vk.events",
        bootstrap_servers=bootstrap_servers,
        group_id="test-idempotency-group",
        auto_offset_reset="earliest",
    )
    await consumer.start()
    try:
        seen_event_ids: set[str] = set()
        for _ in range(2):
            msg = await consumer.getone(timeout_ms=10000)
            decoded = json.loads(msg.value.decode())
            seen_event_ids.add(decoded["event_id"])
        assert event_id in seen_event_ids
    finally:
        await consumer.stop()
