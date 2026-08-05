import json
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from common.kafka import consumer_retry
from common.kafka.consumer_retry import ConsumerRetryController


class FakeSession:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None

    def begin(self):
        return self


@pytest.mark.asyncio
async def test_retry_persists_exception_instead_of_message_payload(monkeypatch):
    repository = SimpleNamespace(
        get_retry_count=AsyncMock(side_effect=[None, 1]),
        upsert_retry=AsyncMock(),
    )
    send_to_dlq = AsyncMock()
    monkeypatch.setattr(consumer_retry, "send_to_dlq", send_to_dlq)
    controller = ConsumerRetryController(
        session_factory=FakeSession,
        repository=repository,
        consumer_name="vk-service-vk-commands",
        kafka_topic="parsevk.vk.commands",
        dlq_topic="parsevk.vk.commands.dlq",
        bootstrap_servers="kafka:9092",
        max_retries=1,
    )
    raw_value = json.dumps(
        {
            "messageId": "00000000-0000-0000-0000-000000000001",
            "messageType": "vk.execution.requested",
            "payload": {"secret": "must-not-become-last-error"},
        }
    ).encode()
    message = SimpleNamespace(
        value=raw_value,
        topic="parsevk.vk.commands",
        partition=0,
        offset=7,
    )
    consumer = SimpleNamespace(commit=AsyncMock())

    await controller.handle_failure(
        message,
        RuntimeError("database unavailable"),
        consumer,
    )

    retry_call = repository.upsert_retry.await_args.args
    assert retry_call[1] == "00000000-0000-0000-0000-000000000001"
    assert retry_call[2] == "vk.execution.requested"
    assert retry_call[3] == "RuntimeError: database unavailable"
    assert "must-not-become-last-error" not in retry_call[3]

    headers = dict(send_to_dlq.await_args.kwargs["headers"])
    assert headers["failure_reason"] == b"RuntimeError: database unavailable"
    consumer.commit.assert_awaited_once()
