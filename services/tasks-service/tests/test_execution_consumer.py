"""Tests for the unified execution event consumer and service."""

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from aiokafka import ConsumerRecord

from app.db.models import OutboxEvent, ProcessedEvent
from app.modules.execution_events.consumer import (
    EXECUTION_EVENT_TYPES,
    _parse_payload,
    handle_execution_event,
)
from app.modules.execution_events.handlers import TERMINAL_STATUSES
from app.modules.execution_events.service import ExecutionEventService


@pytest.fixture
def anyio_backend():
    return "asyncio"


def _make_record(
    value: str | None,
    topic: str = "parsevk.vk.events",
    partition: int = 0,
    offset: int = 1,
) -> ConsumerRecord:
    return ConsumerRecord(
        topic=topic,
        partition=partition,
        offset=offset,
        timestamp=0,
        timestamp_type=0,
        key=None,
        value=value,
        checksum=None,
        serialized_key_size=0,
        serialized_value_size=0,
        headers=[],
    )


def _make_envelope(
    event_type: str,
    payload: dict,
    event_id: str = "evt-1",
) -> str:
    return json.dumps(
        {
            "event_id": event_id,
            "event_type": event_type,
            "payload": json.dumps(payload),
        }
    )


def _make_started_payload(task_id: int = 42, seq: int = 1) -> dict:
    return {
        "taskId": task_id,
        "runId": "run-42",
        "ownerUserId": "user-1",
        "executor": "vk-service",
        "workerId": "worker-1",
        "attempt": 1,
        "executionSequence": seq,
        "startedAt": "2026-01-01T00:00:00Z",
    }


def _make_progressed_payload(task_id: int = 42, seq: int = 2) -> dict:
    return {
        "taskId": task_id,
        "runId": "run-42",
        "ownerUserId": "user-1",
        "executor": "vk-service",
        "executionSequence": seq,
        "processedItems": 10,
        "totalItems": 100,
        "progress": 0.1,
        "stats": {"processed": 10},
    }


def _make_completed_payload(task_id: int = 42, seq: int = 3) -> dict:
    return {
        "taskId": task_id,
        "runId": "run-42",
        "ownerUserId": "user-1",
        "executor": "vk-service",
        "workerId": "worker-1",
        "executionSequence": seq,
        "processedItems": 100,
        "totalItems": 100,
        "stats": {"processed": 100},
    }


def _make_failed_payload(task_id: int = 42, seq: int = 3) -> dict:
    return {
        "taskId": task_id,
        "runId": "run-42",
        "ownerUserId": "user-1",
        "executor": "vk-service",
        "workerId": "worker-1",
        "executionSequence": seq,
        "processedItems": 50,
        "totalItems": 100,
        "stats": {"processed": 50},
        "error": "worker crashed",
        "failureKind": "runtime",
    }


def _make_task_row(
    status: str = "pending",
    run_id: str = "run-42",
    last_seq: int = 0,
    revision: int = 0,
) -> tuple:
    return (42, status, run_id, last_seq, revision, "user-1", 0, 100, 0.0)


def _mock_result_none():
    m = MagicMock()
    m.scalar_one_or_none.return_value = None
    m.one_or_none.return_value = None
    return m


def _mock_result_processed_exists():
    m = MagicMock()
    m.scalar_one_or_none.return_value = MagicMock()
    return m


def _mock_result_task_row(row):
    m = MagicMock()
    m.one_or_none.return_value = row
    return m


def _mock_session_with_task_row(row):
    session = AsyncMock()
    session.execute = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()

    session.execute.side_effect = [
        _mock_result_none(),  # duplicate check
        _mock_result_task_row(row),  # SELECT FOR UPDATE
        MagicMock(),  # UPDATE
    ]
    return session


# ---------------------------------------------------------------------------
# Payload parsing
# ---------------------------------------------------------------------------

def test_parse_payload_started():
    raw = json.dumps(_make_started_payload())
    parsed = _parse_payload("task.execution_started", raw)
    assert parsed is not None
    assert parsed.taskId == 42
    assert parsed.runId == "run-42"


def test_parse_payload_progressed():
    raw = json.dumps(_make_progressed_payload())
    parsed = _parse_payload("task.execution_progressed", raw)
    assert parsed is not None
    assert parsed.processedItems == 10


def test_parse_payload_completed():
    raw = json.dumps(_make_completed_payload())
    parsed = _parse_payload("task.execution_completed", raw)
    assert parsed is not None
    assert parsed.processedItems == 100


def test_parse_payload_failed():
    raw = json.dumps(_make_failed_payload())
    parsed = _parse_payload("task.execution_failed", raw)
    assert parsed is not None
    assert parsed.error == "worker crashed"


def test_parse_payload_invalid_returns_none():
    assert _parse_payload("task.execution_started", "not-json") is None


# ---------------------------------------------------------------------------
# Consumer-level handler
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_handle_execution_event_skips_non_execution_event():
    session = AsyncMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()

    value = json.dumps({"event_id": "evt-1", "event_type": "task.created"})
    msg = _make_record(value)

    ok = await handle_execution_event(session, msg, "consumer-1")

    assert ok is True
    session.execute.assert_not_awaited()
    session.commit.assert_not_awaited()


@pytest.mark.anyio
async def test_handle_execution_event_started_applies_and_emits_state_changed():
    session = _mock_session_with_task_row(_make_task_row(status="pending"))
    msg = _make_record(_make_envelope("task.execution_started", _make_started_payload(seq=1)))

    ok = await handle_execution_event(session, msg, "consumer-1")

    assert ok is True
    assert session.execute.await_count == 3
    assert session.commit.await_count == 1

    added_models = [call.args[0] for call in session.add.call_args_list]
    state_events = [m for m in added_models if getattr(m, "event_type", None) == "task.state_changed"]
    assert len(state_events) == 1
    assert state_events[0].payload["status"] == "running"


@pytest.mark.anyio
async def test_handle_execution_event_progressed_applies_and_emits_state_changed():
    session = _mock_session_with_task_row(_make_task_row(status="running", last_seq=1, revision=1))
    msg = _make_record(_make_envelope("task.execution_progressed", _make_progressed_payload(seq=2)))

    ok = await handle_execution_event(session, msg, "consumer-1")

    assert ok is True
    assert session.execute.await_count == 3
    assert session.commit.await_count == 1

    added_models = [call.args[0] for call in session.add.call_args_list]
    state_events = [m for m in added_models if getattr(m, "event_type", None) == "task.state_changed"]
    assert len(state_events) == 1
    assert state_events[0].payload["progress"] == 0.1


@pytest.mark.anyio
async def test_handle_execution_event_completed_applies_and_emits_both_outbox_events():
    session = _mock_session_with_task_row(_make_task_row(status="running", last_seq=2, revision=2))
    msg = _make_record(_make_envelope("task.execution_completed", _make_completed_payload(seq=3)))

    ok = await handle_execution_event(session, msg, "consumer-1")

    assert ok is True
    assert session.commit.await_count == 1

    added_models = [call.args[0] for call in session.add.call_args_list]
    event_types = [getattr(m, "event_type", None) for m in added_models]
    assert "task.completed" in event_types
    assert "task.state_changed" in event_types


@pytest.mark.anyio
async def test_handle_execution_event_failed_applies_and_emits_both_outbox_events():
    session = _mock_session_with_task_row(_make_task_row(status="running", last_seq=2, revision=2))
    msg = _make_record(_make_envelope("task.execution_failed", _make_failed_payload(seq=3)))

    ok = await handle_execution_event(session, msg, "consumer-1")

    assert ok is True
    assert session.commit.await_count == 1

    added_models = [call.args[0] for call in session.add.call_args_list]
    event_types = [getattr(m, "event_type", None) for m in added_models]
    assert "task.failed" in event_types
    assert "task.state_changed" in event_types


@pytest.mark.anyio
async def test_handle_execution_event_skips_duplicate_event_id():
    session = AsyncMock()
    session.execute = AsyncMock()
    session.execute.return_value = _mock_result_processed_exists()
    session.commit = AsyncMock()

    msg = _make_record(_make_envelope("task.execution_started", _make_started_payload()))

    ok = await handle_execution_event(session, msg, "consumer-1")

    assert ok is True
    session.execute.assert_awaited_once()
    session.commit.assert_not_awaited()


@pytest.mark.anyio
async def test_handle_execution_event_skips_stale_sequence():
    session = AsyncMock()
    session.execute = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()

    session.execute.side_effect = [
        _mock_result_none(),  # duplicate check
        _mock_result_task_row(_make_task_row(status="running", last_seq=5)),
    ]

    msg = _make_record(_make_envelope("task.execution_progressed", _make_progressed_payload(seq=3)))

    ok = await handle_execution_event(session, msg, "consumer-1")

    assert ok is True
    assert session.execute.await_count == 2
    # ProcessedEvent only; no outbox event because stale.
    assert session.add.call_count == 1
    assert isinstance(session.add.call_args.args[0], ProcessedEvent)


@pytest.mark.anyio
async def test_handle_execution_event_skips_wrong_run_id():
    session = AsyncMock()
    session.execute = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()

    session.execute.side_effect = [
        _mock_result_none(),
        _mock_result_task_row(_make_task_row(status="running", run_id="run-expected")),
    ]

    payload = _make_progressed_payload()
    payload["runId"] = "run-wrong"
    msg = _make_record(_make_envelope("task.execution_progressed", payload))

    ok = await handle_execution_event(session, msg, "consumer-1")

    assert ok is True
    assert session.execute.await_count == 2
    assert session.add.call_count == 1
    assert isinstance(session.add.call_args.args[0], ProcessedEvent)


@pytest.mark.anyio
async def test_handle_execution_event_skips_terminal_status():
    session = AsyncMock()
    session.execute = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()

    session.execute.side_effect = [
        _mock_result_none(),
        _mock_result_task_row(_make_task_row(status="done")),
    ]

    msg = _make_record(_make_envelope("task.execution_progressed", _make_progressed_payload(seq=2)))

    ok = await handle_execution_event(session, msg, "consumer-1")

    assert ok is True
    assert session.execute.await_count == 2
    assert session.add.call_count == 1
    assert isinstance(session.add.call_args.args[0], ProcessedEvent)


@pytest.mark.anyio
async def test_handle_execution_event_sequence_gap_returns_false_and_rolls_back():
    session = AsyncMock()
    session.execute = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()

    session.execute.side_effect = [
        _mock_result_none(),
        _mock_result_task_row(_make_task_row(status="running", last_seq=1)),
    ]

    payload = _make_progressed_payload(seq=5)
    msg = _make_record(_make_envelope("task.execution_progressed", payload))

    ok = await handle_execution_event(session, msg, "consumer-1")

    assert ok is False
    session.rollback.assert_awaited_once()
    session.commit.assert_not_awaited()
    session.add.assert_not_called()


@pytest.mark.anyio
async def test_handle_execution_event_malformed_payload_skips_with_offset_commit():
    session = AsyncMock()
    session.execute = AsyncMock()
    session.execute.return_value = _mock_result_none()
    session.commit = AsyncMock()

    msg = _make_record(
        _make_envelope("task.execution_progressed", {"invalid": "payload"})
    )

    ok = await handle_execution_event(session, msg, "consumer-1")

    assert ok is True
    session.commit.assert_awaited_once()


# ---------------------------------------------------------------------------
# Service-level lifecycle transitions
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_apply_started_from_pending_emits_state_changed():
    session = _mock_session_with_task_row(_make_task_row(status="pending"))
    service = ExecutionEventService(session)

    ok = await service.apply_started(42, "run-42", 1, "user-1")

    assert ok is True
    added = [call.args[0] for call in session.add.call_args_list]
    assert any(getattr(m, "event_type", None) == "task.state_changed" for m in added)


@pytest.mark.anyio
async def test_apply_started_from_running_does_not_emit():
    session = _mock_session_with_task_row(_make_task_row(status="running"))
    service = ExecutionEventService(session)

    ok = await service.apply_started(42, "run-42", 2, "user-1")

    assert ok is True
    session.add.assert_not_called()


@pytest.mark.anyio
async def test_happy_path_started_progressed_completed():
    row = _make_task_row(status="pending")

    # started
    session1 = _mock_session_with_task_row(row)
    service1 = ExecutionEventService(session1)
    assert await service1.apply_started(42, "run-42", 1, "user-1") is True

    # progressed
    session2 = _mock_session_with_task_row(_make_task_row(status="running", last_seq=1, revision=1))
    service2 = ExecutionEventService(session2)
    assert await service2.apply_progressed(42, "run-42", 2, 10, 100, 0.1, {"p": 10}, "user-1") is True

    # completed
    session3 = _mock_session_with_task_row(_make_task_row(status="running", last_seq=2, revision=2))
    service3 = ExecutionEventService(session3)
    assert await service3.apply_completed(42, "run-42", 3, 100, 100, {"p": 100}, "user-1") is True
    added3 = [call.args[0] for call in session3.add.call_args_list]
    assert any(getattr(m, "event_type", None) == "task.completed" for m in added3)
    state3 = next(m for m in added3 if getattr(m, "event_type", None) == "task.state_changed")
    assert state3.payload["status"] == "done"
    assert state3.payload["progress"] == 1.0


@pytest.mark.anyio
async def test_happy_path_started_progressed_failed():
    # started
    session1 = _mock_session_with_task_row(_make_task_row(status="pending"))
    service1 = ExecutionEventService(session1)
    assert await service1.apply_started(42, "run-42", 1, "user-1") is True

    # progressed
    session2 = _mock_session_with_task_row(_make_task_row(status="running", last_seq=1, revision=1))
    service2 = ExecutionEventService(session2)
    assert await service2.apply_progressed(42, "run-42", 2, 50, 100, 0.5, {"p": 50}, "user-1") is True

    # failed
    session3 = _mock_session_with_task_row(_make_task_row(status="running", last_seq=2, revision=2))
    service3 = ExecutionEventService(session3)
    assert await service3.apply_failed(42, "run-42", 3, 50, 100, {"p": 50}, "boom", "runtime", "user-1") is True
    added3 = [call.args[0] for call in session3.add.call_args_list]
    failed = next(m for m in added3 if getattr(m, "event_type", None) == "task.failed")
    assert failed.payload["error"] == "boom"
    state3 = next(m for m in added3 if getattr(m, "event_type", None) == "task.state_changed")
    assert state3.payload["status"] == "failed"
    assert state3.payload["progress"] == 0.5


# ---------------------------------------------------------------------------
# Execution event type set
# ---------------------------------------------------------------------------

def test_execution_event_types_contains_all_four():
    assert EXECUTION_EVENT_TYPES == {
        "task.execution_started",
        "task.execution_progressed",
        "task.execution_completed",
        "task.execution_failed",
    }


def test_terminal_statuses():
    assert TERMINAL_STATUSES == {"done", "failed", "cancelled"}
