import asyncio
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.background import outbox_worker
from app.modules.outbox.publisher import kafka_key_for_event

SENSITIVE_KEYS = {
    "authorization",
    "cookie",
    "access_token",
    "refresh_token",
    "password",
}


def test_task_event_type_has_no_version_suffix():
    assert not "task.created".endswith(".v1")


def test_kafka_key_for_task_event_uses_task_id():
    assert kafka_key_for_event(
        "task.created",
        {"taskId": "42", "ownerUserId": "u1"},
        "42",
    ) == "42"


def test_kafka_key_for_automation_settings_event_uses_owner():
    assert kafka_key_for_event(
        "task.automation_settings_updated",
        {"ownerUserId": "u1", "enabled": True},
        "u1",
    ) == "u1"


def test_kafka_key_for_vk_command_uses_execution_id():
    execution_id = str(uuid4())
    assert kafka_key_for_event(
        "vk.execution.requested",
        {"executionId": execution_id},
        "ignored",
    ) == execution_id


def test_payload_has_no_sensitive_keys():
    payload = {
        "taskId": "42",
        "ownerUserId": "u1",
        "source": "manual",
    }
    lowered = {str(key).lower() for key in payload}
    assert lowered.isdisjoint(SENSITIVE_KEYS)


@pytest.mark.anyio
async def test_outbox_loop_continues_after_publish_error(monkeypatch):
    calls = 0

    class FakeContextManager:
        async def __aenter__(self):
            return self

        async def __aexit__(self, _exc_type, _exc, _tb):
            return False

        def begin(self):
            return self

    class FakePublisher:
        async def publish_batch(self):
            nonlocal calls
            calls += 1
            if calls == 1:
                raise RuntimeError("kafka unavailable")
            raise asyncio.CancelledError

    class FakeFactory:
        def __init__(self, session, *, producer, on_task_complete=None):
            self.session = session
            self.producer = producer

        def create_outbox_publisher(self):
            return FakePublisher()

    class FakeProducer:
        async def start(self):
            return None

        async def stop(self):
            return None

    health = AsyncMock()

    async def sleep_without_delay(_seconds):
        return None

    monkeypatch.setattr(outbox_worker, "SessionLocal", FakeContextManager)
    monkeypatch.setattr(
        outbox_worker,
        "AIOKafkaProducer",
        lambda **_kwargs: FakeProducer(),
    )
    monkeypatch.setattr(outbox_worker, "ApplicationFactory", FakeFactory)
    monkeypatch.setattr(outbox_worker.asyncio, "sleep", sleep_without_delay)

    with pytest.raises(asyncio.CancelledError):
        await outbox_worker.publish_outbox_forever(health)

    assert calls == 2
