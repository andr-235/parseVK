import json
import logging
from uuid import uuid4

import pytest

logger = logging.getLogger(__name__)

pytestmark = pytest.mark.integration


@pytest.fixture(scope="module")
def bootstrap_servers():
    import os
    tc = os.environ.get("TESTCONTAINERS_KAFKA_BOOTSTRAP")
    if tc:
        return tc
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
    topic_names = ["identity.events"]
    existing = await admin.list_topics()
    to_create = [NewTopic(name=t, num_partitions=3, replication_factor=1) for t in topic_names if t not in existing]
    if to_create:
        await admin.create_topics(to_create)
    await admin.close()
    yield topic_names


@pytest.mark.anyio
async def test_identity_event_roundtrip(bootstrap_servers, topics):
    from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
    from common.events import EventEnvelope

    user_id = str(uuid4())
    event = EventEnvelope(
        event_type="identity.user_created",
        producer="identity-service",
        correlation_id=str(uuid4()),
        payload={"user_id": user_id},
    ).model_dump(mode="json")

    producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
    await producer.start()
    try:
        await producer.send_and_wait(
            "identity.events",
            json.dumps(event).encode(),
            key=user_id.encode(),
        )
    finally:
        await producer.stop()

    consumer = AIOKafkaConsumer(
        "identity.events",
        bootstrap_servers=bootstrap_servers,
        group_id="test-identity-group",
        auto_offset_reset="earliest",
    )
    await consumer.start()
    try:
        msg = await consumer.getone(timeout_ms=10000)
        decoded = json.loads(msg.value.decode())
        assert decoded["event_type"] == "identity.user_created"
        assert decoded["payload"]["user_id"] == user_id
        assert decoded["producer"] == "identity-service"
    finally:
        await consumer.stop()
