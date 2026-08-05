import sys
from types import SimpleNamespace

import pytest

from common.kafka.consumer import BaseEventConsumer


class FakeKafkaConsumer:
    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs
        self.started = False
        self.stopped = False

    async def start(self):
        self.started = True

    async def stop(self):
        self.stopped = True

    def __aiter__(self):
        return self

    async def __anext__(self):
        raise StopAsyncIteration


class TestConsumer(BaseEventConsumer):
    consumer_group = "test-group"
    consumer_name = "test-consumer"
    dlq_topic = "test.dlq"

    async def handle_message(self, raw_value: bytes) -> None:
        raise AssertionError("empty fake consumer must not yield messages")


@pytest.mark.asyncio
async def test_run_forever_passes_explicit_offset_reset_policy(monkeypatch):
    created = []

    def factory(*args, **kwargs):
        consumer = FakeKafkaConsumer(*args, **kwargs)
        created.append(consumer)
        return consumer

    monkeypatch.setitem(
        sys.modules,
        "aiokafka",
        SimpleNamespace(AIOKafkaConsumer=factory),
    )
    consumer = TestConsumer(
        session_factory=None,
        kafka_topic="test.events",
        bootstrap_servers="kafka:9092",
        model_class=object,
    )
    consumer.auto_offset_reset = "earliest"

    await consumer.run_forever()

    assert len(created) == 1
    assert created[0].args == ("test.events",)
    assert created[0].kwargs["group_id"] == "test-group"
    assert created[0].kwargs["enable_auto_commit"] is False
    assert created[0].kwargs["auto_offset_reset"] == "earliest"
    assert created[0].started is True
    assert created[0].stopped is True


def test_default_policy_preserves_existing_consumers():
    assert BaseEventConsumer.auto_offset_reset == "latest"
