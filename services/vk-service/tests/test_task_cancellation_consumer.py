"""Regression tests for cancellation delivery during canonical rollout."""

import json
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

import app.tasks.kafka_consumer as consumer_module
from app.tasks.kafka_consumer import TaskCancellationEventsConsumer


class SessionContext:
    async def __aenter__(self):
        return SimpleNamespace()

    async def __aexit__(self, exc_type, exc, tb):
        return False


def session_factory():
    return SessionContext()


def task_event(event_type: str) -> bytes:
    return json.dumps(
        {
            "event_id": str(uuid4()),
            "event_type": event_type,
            "event_version": 1,
            "aggregate_id": "42",
            "correlation_id": str(uuid4()),
            "payload": {
                "taskId": "42",
                "ownerUserId": "user-1",
                "runId": str(uuid4()),
            },
        }
    ).encode("utf-8")


@pytest.mark.asyncio
async def test_cancellation_consumer_delivers_cancelled_event(monkeypatch):
    handler = SimpleNamespace(handle=AsyncMock())
    monkeypatch.setattr(
        consumer_module,
        "get_task_events_handler",
        lambda session: handler,
    )
    consumer = TaskCancellationEventsConsumer(
        session_factory=session_factory
    )

    await consumer.handle_message(task_event("task.cancelled"))

    event = handler.handle.await_args.args[0]
    assert event.event_type == "task.cancelled"
    assert consumer.consumer_group == "vk-service-task-cancellations-v1"


@pytest.mark.asyncio
async def test_cancellation_consumer_ignores_execution_request(monkeypatch):
    handler = SimpleNamespace(handle=AsyncMock())
    monkeypatch.setattr(
        consumer_module,
        "get_task_events_handler",
        lambda session: handler,
    )
    consumer = TaskCancellationEventsConsumer(
        session_factory=session_factory
    )

    await consumer.handle_message(task_event("task.created"))

    handler.handle.assert_not_awaited()
