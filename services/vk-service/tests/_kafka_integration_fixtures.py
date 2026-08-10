import os

import pytest

INGESTION_TOPIC = "parsevk.content.ingestion.vk"
INGESTION_DLQ_TOPIC = "parsevk.content.ingestion.vk.dlq"
TRANSPORT_LIMIT_BYTES = 1_048_576
APPLICATION_HARD_LIMIT_BYTES = 768 * 1024
KAFKA_TEST_IMAGE = "confluentinc/cp-kafka:7.6.0"


@pytest.fixture(scope="module")
def bootstrap_servers():
    tc = os.environ.get("TESTCONTAINERS_KAFKA_BOOTSTRAP")
    if tc:
        yield tc
        return

    try:
        from testcontainers.kafka import KafkaContainer

        with KafkaContainer(image=KAFKA_TEST_IMAGE).with_kraft() as kafka:
            yield kafka.get_bootstrap_server()
    except Exception as exc:
        if os.environ.get("CI"):
            pytest.fail(f"KafkaContainer is required in CI but failed to start: {exc}")
        pytest.skip(f"KafkaContainer not available: {exc}")


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
