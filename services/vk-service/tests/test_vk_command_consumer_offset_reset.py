import sys
from types import SimpleNamespace

import pytest

from app.tasks.vk_commands_consumer import VkExecutionCommandsConsumer


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


@pytest.mark.asyncio
async def test_canonical_consumer_passes_earliest_to_aiokafka(monkeypatch):
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
    consumer = VkExecutionCommandsConsumer(session_factory=None)

    await consumer.run_forever()

    assert VkExecutionCommandsConsumer.consumer_group == "vk-service-vk-commands"
    assert VkExecutionCommandsConsumer.auto_offset_reset == "earliest"
    assert len(created) == 1
    assert created[0].kwargs["group_id"] == "vk-service-vk-commands"
    assert created[0].kwargs["enable_auto_commit"] is False
    assert created[0].kwargs["auto_offset_reset"] == "earliest"
    assert created[0].started is True
    assert created[0].stopped is True
