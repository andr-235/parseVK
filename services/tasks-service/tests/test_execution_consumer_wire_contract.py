"""Regression coverage for execution events published as WireEvent."""

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from aiokafka import ConsumerRecord
from common.events import WireEvent

from app.modules.execution_events import consumer as execution_consumer
from app.modules.execution_events.consumer import _parse_payload, handle_execution_event


PAYLOADS = {
    "task.execution_started": {
        "taskId": 42,
        "runId": "run-42",
        "ownerUserId": "user-1",
        "executor": "vk-service",
        "workerId": "worker-1",
        "attempt": 1,
        "executionSequence": 1,
        "startedAt": "2026-08-11T07:27:02Z",
    },
    "task.execution_progressed": {
        "taskId": 42,
        "runId": "run-42",
        "ownerUserId": "user-1",
        "executor": "vk-service",
        "executionSequence": 2,
        "processedItems": 10,
        "totalItems": 100,
        "progress": 0.1,
        "stats": {"processed": 10},
    },
    "task.execution_completed": {
        "taskId": 42,
        "runId": "run-42",
        "ownerUserId": "user-1",
        "executor": "vk-service",
        "workerId": "worker-1",
        "executionSequence": 3,
        "processedItems": 100,
        "totalItems": 100,
        "stats": {"processed": 100},
    },
    "task.execution_failed": {
        "taskId": 42,
        "runId": "run-42",
        "ownerUserId": "user-1",
        "executor": "vk-service",
        "workerId": "worker-1",
        "executionSequence": 3,
        "processedItems": 50,
        "totalItems": 100,
        "stats": {"processed": 50},
        "error": "worker crashed",
        "failureKind": "runtime",
    },
}


@pytest.mark.parametrize(("event_type", "payload"), PAYLOADS.items())
def test_parse_payload_accepts_wire_event_payload_objects(event_type, payload):
    parsed = _parse_payload(event_type, payload)

    assert parsed is not None
    assert parsed.taskId == 42
    assert parsed.runId == "run-42"


def test_parse_payload_keeps_json_string_compatibility():
    parsed = _parse_payload(
        "task.execution_started",
        json.dumps(PAYLOADS["task.execution_started"]),
    )

    assert parsed is not None
    assert parsed.executionSequence == 1


def test_parse_payload_rejects_non_object_payload():
    assert _parse_payload("task.execution_started", 123) is None


def _make_record(value: str) -> ConsumerRecord:
    return ConsumerRecord(
        topic="parsevk.vk.events",
        partition=0,
        offset=1,
        timestamp=0,
        timestamp_type=0,
        key=None,
        value=value,
        checksum=None,
        serialized_key_size=0,
        serialized_value_size=0,
        headers=[],
    )


@pytest.mark.anyio
async def test_handle_execution_event_accepts_production_wire_event(monkeypatch):
    session = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    session.execute = AsyncMock(return_value=result)
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()

    service = MagicMock()
    service.apply_started = AsyncMock(return_value=True)
    monkeypatch.setattr(
        execution_consumer,
        "ExecutionEventService",
        lambda _session: service,
    )

    wire = WireEvent(
        event_id=uuid4(),
        event_type="task.execution_started",
        event_version=1,
        aggregate_type="task",
        aggregate_id="42",
        correlation_id=None,
        payload=PAYLOADS["task.execution_started"],
        created_at="2026-08-11T07:27:02+00:00",
    )

    ok = await handle_execution_event(
        session,
        _make_record(wire.model_dump_json()),
        "consumer-1",
    )

    assert ok is True
    service.apply_started.assert_awaited_once_with(
        task_id=42,
        run_id="run-42",
        execution_sequence=1,
        owner_user_id="user-1",
    )
    session.commit.assert_awaited_once()
    session.rollback.assert_not_awaited()
