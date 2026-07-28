"""Tests for task.execution_progressed Kafka consumer."""

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from aiokafka import ConsumerRecord
from common.events.task_execution_progressed import TaskExecutionProgressedPayload

from app.modules.tasks.consumer import (
    TERMINAL_STATUSES,
    _has_terminal_status,
    _is_processed,
    _parse_payload,
    handle_execution_progressed,
)


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


def _make_payload(**overrides) -> TaskExecutionProgressedPayload:
    defaults = {
        "taskId": 42,
        "runId": "run-42",
        "ownerUserId": "user-1",
        "executor": "vk-service",
        "executionSequence": 1,
        "processedItems": 10,
        "totalItems": 100,
        "progress": 0.1,
        "stats": {"processed": 10},
    }
    defaults.update(overrides)
    return TaskExecutionProgressedPayload(**defaults)


def test_parse_payload_from_string():
    raw = json.dumps(
        {
            "taskId": 1,
            "runId": "run-1",
            "ownerUserId": "user-1",
            "executor": "vk-service",
            "executionSequence": 1,
            "processedItems": 5,
            "totalItems": 10,
            "progress": 0.5,
        }
    )
    parsed = _parse_payload(raw)
    assert parsed is not None
    assert parsed.taskId == 1
    assert parsed.runId == "run-1"


def test_parse_payload_from_dict():
    raw = {
        "taskId": 1,
        "runId": "run-1",
        "ownerUserId": "user-1",
        "executor": "vk-service",
        "executionSequence": 1,
        "processedItems": 5,
        "totalItems": 10,
        "progress": 0.5,
    }
    parsed = _parse_payload(raw)
    assert parsed is not None
    assert parsed.taskId == 1


def test_parse_payload_invalid_returns_none():
    assert _parse_payload("not-json") is None
    assert _parse_payload({"taskId": "not-an-int"}) is None


@pytest.mark.anyio
async def test_is_processed_queries_by_event_id_and_consumer_name():
    session = AsyncMock()
    session.execute = AsyncMock()
    mock_scalar = MagicMock()
    mock_scalar.scalar_one_or_none.return_value = None
    session.execute.return_value = mock_scalar

    result = await _is_processed(session, "topic:0:1", "consumer-1")
    assert result is False

    call_args = session.execute.await_args
    stmt = call_args.args[0]
    compiled = stmt.compile(compile_kwargs={"literal_binds": True})
    assert "event_id" in str(compiled)
    assert "consumer_name" in str(compiled)


@pytest.mark.anyio
async def test_has_terminal_status_true_when_task_missing():
    session = AsyncMock()
    session.execute = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    session.execute.return_value = mock_result

    assert await _has_terminal_status(session, 42) is True


@pytest.mark.anyio
async def test_has_terminal_status_true_for_terminal_status():
    session = AsyncMock()
    session.execute = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = "done"
    session.execute.return_value = mock_result

    assert await _has_terminal_status(session, 42) is True


@pytest.mark.anyio
async def test_has_terminal_status_false_for_running():
    session = AsyncMock()
    session.execute = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = "running"
    session.execute.return_value = mock_result

    assert await _has_terminal_status(session, 42) is False


@pytest.mark.anyio
async def test_handle_execution_progressed_updates_task_and_emits_outbox():
    session = AsyncMock()
    session.execute = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()

    # First call: SELECT processed_events (duplicate check) -> None
    # Second call: SELECT Task.status -> running
    # Third call: SELECT FOR UPDATE -> task row
    # Fourth call: UPDATE tasks
    select_processed = MagicMock()
    select_processed.scalar_one_or_none.return_value = None

    select_status = MagicMock()
    select_status.scalar_one_or_none.return_value = "running"

    select_for_update = MagicMock()
    select_for_update.one_or_none.return_value = (42, "running", "run-42", 0, 5)

    update_result = MagicMock()

    session.execute.side_effect = [
        select_processed,
        select_status,
        select_for_update,
        update_result,
    ]

    msg = _make_record("dummy", offset=1)
    payload = _make_payload()

    ok = await handle_execution_progressed(session, msg, payload, "consumer-1")

    assert ok is True
    assert session.execute.await_count == 4
    assert session.commit.await_count == 1
    # OutboxEvent + ProcessedEvent both added via session.add
    assert session.add.call_count == 2

    added_models = [call.args[0] for call in session.add.call_args_list]
    outbox_event = next(
        m for m in added_models if getattr(m, "event_type", None) == "task.state_changed"
    )
    assert outbox_event.aggregate_type == "task"
    assert outbox_event.aggregate_id == "42"
    assert outbox_event.payload["taskRevision"] == 6


@pytest.mark.anyio
async def test_handle_execution_progressed_skips_duplicate_event():
    session = AsyncMock()
    session.execute = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = MagicMock()  # already processed
    session.execute.return_value = mock_result
    session.commit = AsyncMock()

    msg = _make_record("dummy", offset=1)
    payload = _make_payload()

    ok = await handle_execution_progressed(session, msg, payload, "consumer-1")

    assert ok is True
    session.execute.assert_awaited_once()
    session.commit.assert_not_awaited()


@pytest.mark.anyio
async def test_handle_execution_progressed_skips_stale_sequence():
    session = AsyncMock()
    session.execute = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()

    select_processed = MagicMock()
    select_processed.scalar_one_or_none.return_value = None

    select_status = MagicMock()
    select_status.scalar_one_or_none.return_value = "running"

    select_for_update = MagicMock()
    select_for_update.one_or_none.return_value = (42, "running", "run-42", 5, 1)

    session.execute.side_effect = [select_processed, select_status, select_for_update]

    msg = _make_record("dummy", offset=1)
    payload = _make_payload(executionSequence=3)

    ok = await handle_execution_progressed(session, msg, payload, "consumer-1")

    assert ok is True
    # No UPDATE executed; only SELECTs + mark processed commit
    assert session.execute.await_count == 3
    assert session.add.call_count == 1  # only ProcessedEvent


@pytest.mark.anyio
async def test_handle_execution_progressed_skips_run_id_mismatch():
    session = AsyncMock()
    session.execute = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()

    select_processed = MagicMock()
    select_processed.scalar_one_or_none.return_value = None

    select_status = MagicMock()
    select_status.scalar_one_or_none.return_value = "running"

    select_for_update = MagicMock()
    select_for_update.one_or_none.return_value = (42, "running", "run-42", 0, 1)

    session.execute.side_effect = [select_processed, select_status, select_for_update]

    msg = _make_record("dummy", offset=1)
    payload = _make_payload(runId="run-99")

    ok = await handle_execution_progressed(session, msg, payload, "consumer-1")

    assert ok is True
    assert session.execute.await_count == 3
    assert session.add.call_count == 1


@pytest.mark.anyio
async def test_handle_execution_progressed_skips_terminal_status():
    session = AsyncMock()
    session.execute = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()

    select_processed = MagicMock()
    select_processed.scalar_one_or_none.return_value = None

    select_status = MagicMock()
    select_status.scalar_one_or_none.return_value = "done"

    session.execute.side_effect = [select_processed, select_status]

    msg = _make_record("dummy", offset=1)
    payload = _make_payload()

    ok = await handle_execution_progressed(session, msg, payload, "consumer-1")

    assert ok is True
    assert session.execute.await_count == 2
    assert session.add.call_count == 1


@pytest.mark.anyio
async def test_consume_progress_events_creates_consumer_with_expected_config():
    """Consumer factory is invoked with the expected Kafka configuration."""

    captured = {}

    class FakeConsumer:
        async def start(self):
            pass

        async def stop(self):
            pass

        def __aiter__(self):
            return self

        async def __anext__(self):
            raise StopAsyncIteration

        async def commit(self):
            pass



@pytest.mark.anyio
async def test_consume_progress_events_creates_consumer_with_expected_config():
    """Consumer factory is invoked with the expected Kafka configuration."""

    captured = {}

    class FakeConsumer:
        async def start(self):
            pass

        async def stop(self):
            pass

        def __aiter__(self):
            return self

        async def __anext__(self):
            raise StopAsyncIteration

        async def commit(self):
            pass

    def fake_consumer_factory(*topics, **kwargs):
        captured["topics"] = topics
        captured["kwargs"] = kwargs
        return FakeConsumer()

    # Import the consumer module fresh inside the test so we can safely monkeypatch
    # its AIOKafkaConsumer binding without affecting a stale function object.
    import app.modules.tasks.consumer as consumer_module

    original = consumer_module.AIOKafkaConsumer
    consumer_module.AIOKafkaConsumer = fake_consumer_factory
    try:
        await consumer_module.consume_progress_events(
            bootstrap_servers="kafka:9092",
            group_id="test-group",
            topic="parsevk.vk.events",
            session_factory=MagicMock(),
        )
    except StopAsyncIteration:
        pass
    finally:
        consumer_module.AIOKafkaConsumer = original

    assert captured["topics"] == ("parsevk.vk.events",)
    assert captured["kwargs"]["bootstrap_servers"] == "kafka:9092"
    assert captured["kwargs"]["group_id"] == "test-group"
    assert captured["kwargs"]["enable_auto_commit"] is False
    assert captured["kwargs"]["auto_offset_reset"] == "earliest"
