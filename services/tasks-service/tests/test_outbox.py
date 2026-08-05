import asyncio
import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from common.outbox.models import OutboxMessage

from app.background import outbox_worker
from app.modules.outbox.publisher import (
    MAX_OUTBOX_ATTEMPTS,
    OutboxPublisher,
    kafka_key_for_event,
)

SENSITIVE_KEYS = {
    "authorization",
    "cookie",
    "access_token",
    "refresh_token",
    "password",
}


def assert_no_sensitive_payload(payload):
    lowered = {str(key).lower() for key in payload}
    assert lowered.isdisjoint(SENSITIVE_KEYS)


def test_task_event_type_has_no_version_suffix():
    assert "task.created".endswith(".v1") is False


def test_kafka_key_for_task_event_uses_task_id():
    assert (
        kafka_key_for_event(
            "task.created",
            {"taskId": "42", "ownerUserId": "u1"},
            "42",
        )
        == "42"
    )


def test_kafka_key_for_automation_settings_event_uses_owner():
    assert (
        kafka_key_for_event(
            "task.automation_settings_updated",
            {"ownerUserId": "u1", "enabled": True},
            "u1",
        )
        == "u1"
    )


def test_kafka_key_for_vk_command_uses_execution_id():
    execution_id = str(uuid4())
    assert (
        kafka_key_for_event(
            "vk.execution.requested",
            {"executionId": execution_id},
            "ignored",
        )
        == execution_id
    )


def test_kafka_key_for_vk_cancel_command_uses_execution_id():
    execution_id = str(uuid4())
    assert (
        kafka_key_for_event(
            "vk.execution.cancel_requested",
            {"executionId": execution_id},
            "ignored",
        )
        == execution_id
    )


def test_payload_has_no_sensitive_keys():
    assert_no_sensitive_payload(
        {
            "taskId": "42",
            "ownerUserId": "u1",
            "source": "manual",
        }
    )


@pytest.mark.anyio
async def test_outbox_loop_continues_after_publish_error(monkeypatch):
    calls = 0

    class FakeContextManager:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
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

    class FakeHealth:
        def mark_cycle_success(self):
            return None

        def mark_cycle_error(self, error: str):
            return None

    async def sleep_without_delay(seconds):
        return None

    monkeypatch.setattr(outbox_worker, "SessionLocal", FakeContextManager)
    monkeypatch.setattr(
        outbox_worker,
        "AIOKafkaProducer",
        lambda **kwargs: FakeProducer(),
    )
    monkeypatch.setattr(outbox_worker, "ApplicationFactory", FakeFactory)
    monkeypatch.setattr(
        outbox_worker.asyncio,
        "sleep",
        sleep_without_delay,
    )

    with pytest.raises(asyncio.CancelledError):
        await outbox_worker.publish_outbox_forever(FakeHealth())

    assert calls == 2


@pytest.mark.anyio
async def test_tasks_service_outbox_events_include_frozen_run_metadata():
    from app.bootstrap import ApplicationFactory
    from app.modules.tasks.schemas import CreateParseTaskRequest

    session = AsyncMock()
    service = ApplicationFactory(session).create_tasks_service()

    initial_run_id = str(uuid4())
    task_mock = MagicMock()
    task_mock.id = 42
    task_mock.owner_user_id = "user-1"
    task_mock.scope = "selected"
    task_mock.mode = "recent_posts"
    task_mock.group_ids = [1, 2]
    task_mock.post_limit = 10
    task_mock.source = "manual"
    task_mock.status = "failed"
    task_mock.execution_run_id = initial_run_id
    task_mock.revision = 5

    service.crud.repository.create_task = AsyncMock(return_value=task_mock)
    service.crud.repository.add_audit = AsyncMock()
    service.crud.outbox.add_event = AsyncMock()

    source_resolver = SimpleNamespace(resolve=AsyncMock())
    service.crud.source_resolver_factory = lambda _session: source_resolver

    async def freeze_created(_session, task):
        return {
            "taskRunId": task.execution_run_id,
            "sourceSetRevision": 5,
            "snapshotSha256": "a" * 64,
        }

    service.crud.freezer = AsyncMock(side_effect=freeze_created)
    service.crud.command_publisher = AsyncMock()

    payload = CreateParseTaskRequest(
        scope="selected",
        groupIds=[1, 2],
        postLimit=10,
        mode="recent_posts",
    )
    await service.create_parse_task("user-1", payload)

    created_call = next(
        call
        for call in service.crud.outbox.add_event.await_args_list
        if call.kwargs["event_type"] == "task.created"
    )
    assert created_call.kwargs["payload"] == {
        "taskId": "42",
        "ownerUserId": "user-1",
        "runId": initial_run_id,
        "scope": "selected",
        "mode": "recent_posts",
        "groupIds": [1, 2],
        "postLimit": 10,
        "source": "manual",
        "taskRunId": initial_run_id,
        "sourceSetRevision": 5,
        "snapshotSha256": "a" * 64,
    }
    service.crud.command_publisher.assert_awaited_once()
    source_resolver.resolve.assert_awaited_once_with(
        task_mock,
        [1, 2],
    )

    service.state.repository.get_task_for_update = AsyncMock(
        return_value=task_mock
    )
    service.state.repository.add_audit = AsyncMock()
    service.state.repository.touch_task = AsyncMock(return_value=task_mock)

    async def freeze_resumed(_session, task, previous_run_id):
        assert previous_run_id == initial_run_id
        return {
            "taskRunId": task.execution_run_id,
            "sourceSetRevision": 6,
            "snapshotSha256": "b" * 64,
        }

    service.state.freezer = AsyncMock(side_effect=freeze_resumed)
    service.state.command_publisher = AsyncMock()

    await service.resume_task("user-1", 42)

    assert task_mock.execution_run_id != initial_run_id
    resume_call = next(
        call
        for call in service.state.outbox.add_event.await_args_list
        if call.kwargs["event_type"] == "task.resumed"
    )
    resumed_run_id = task_mock.execution_run_id
    assert resume_call.kwargs["dedupe_key"] == (
        f"task.resumed:42:{resumed_run_id}"
    )
    assert resume_call.kwargs["payload"]["taskRunId"] == resumed_run_id
    assert resume_call.kwargs["payload"]["snapshotSha256"] == "b" * 64
    service.state.command_publisher.assert_awaited_once()


def _make_event(
    event_id: str,
    attempts: int = 0,
    status: str = "pending",
):
    event = MagicMock()
    event.id = UUID(event_id)
    event.event_type = "task.created"
    event.event_version = 1
    event.aggregate_type = "task"
    event.aggregate_id = "42"
    event.correlation_id = None
    event.dedupe_key = None
    event.payload = {"taskId": "42", "ownerUserId": "u1"}
    event.status = status
    event.attempts = attempts
    event.locked_at = None
    event.published_at = None
    event.last_error = None
    event.created_at = datetime.now(UTC)
    return event


def _make_message(event_id: str, attempts: int = 0):
    return OutboxMessage(
        id=UUID(event_id),
        event_type="task.created",
        event_version=1,
        aggregate_type="task",
        aggregate_id="42",
        correlation_id=None,
        payload={"taskId": "42", "ownerUserId": "u1"},
        attempts=attempts,
        created_at=datetime.now(UTC),
    )


@pytest.fixture(autouse=True)
def enable_outbox():
    from app.core.config import settings

    original = settings.outbox_publish_enabled
    settings.outbox_publish_enabled = True
    yield
    settings.outbox_publish_enabled = original


@pytest.mark.anyio
async def test_publish_batch_calls_mark_published_on_success():
    message = _make_message(
        "00000000-0000-0000-0000-000000000001"
    )
    repo = AsyncMock()
    repo.claim_batch.return_value = [message]
    producer = AsyncMock()

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=True,
    )
    result = await publisher.publish_batch()

    assert result == 1
    repo.mark_published.assert_awaited_once_with(message.id)


@pytest.mark.anyio
async def test_publish_batch_calls_mark_failed_on_error():
    message = _make_message(
        "00000000-0000-0000-0000-000000000002",
        attempts=3,
    )
    repo = AsyncMock()
    repo.claim_batch.return_value = [message]
    repo.mark_failed.return_value = False
    producer = AsyncMock()
    producer.send_and_wait = AsyncMock(
        side_effect=RuntimeError("kafka down")
    )

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=True,
    )
    result = await publisher.publish_batch()

    assert result == 1
    repo.mark_failed.assert_awaited_once_with(message.id, "kafka down")
    repo.mark_published.assert_not_awaited()


@pytest.mark.anyio
async def test_publish_batch_sends_to_dlq_after_max_attempts():
    message = _make_message(
        "00000000-0000-0000-0000-000000000003",
        attempts=MAX_OUTBOX_ATTEMPTS - 1,
    )
    repo = AsyncMock()

    async def mark_failed_side_effect(event_id, error):
        message.attempts += 1
        return message.attempts >= MAX_OUTBOX_ATTEMPTS

    repo.mark_failed = AsyncMock(side_effect=mark_failed_side_effect)
    repo.claim_batch.return_value = [message]
    producer = AsyncMock()
    send_calls = []

    async def send_and_wait_side_effect(topic, **kwargs):
        send_calls.append(topic)
        if topic == "parsevk.tasks.events":
            raise RuntimeError("kafka down")

    producer.send_and_wait = AsyncMock(
        side_effect=send_and_wait_side_effect
    )

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=True,
    )
    result = await publisher.publish_batch()

    assert result == 1
    assert send_calls == ["parsevk.tasks.events", "parsevk.tasks.dlq"]


@pytest.mark.anyio
async def test_publish_batch_no_dlq_below_max_attempts():
    message = _make_message(
        "00000000-0000-0000-0000-000000000004",
        attempts=1,
    )
    repo = AsyncMock()

    async def mark_failed_side_effect(event_id, error):
        message.attempts += 1
        return message.attempts >= MAX_OUTBOX_ATTEMPTS

    repo.mark_failed = AsyncMock(side_effect=mark_failed_side_effect)
    repo.claim_batch.return_value = [message]
    producer = AsyncMock()
    send_calls = []

    async def send_and_wait_side_effect(topic, **kwargs):
        send_calls.append(topic)
        raise RuntimeError("kafka down")

    producer.send_and_wait = AsyncMock(
        side_effect=send_and_wait_side_effect
    )

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=True,
    )
    result = await publisher.publish_batch()

    assert result == 1
    assert send_calls == ["parsevk.tasks.events"]


@pytest.mark.anyio
async def test_repository_mark_failed_backoff_and_status():
    from app.modules.outbox.repository import OutboxRepository

    event = _make_event(
        "00000000-0000-0000-0000-000000000004",
        attempts=1,
    )
    session = AsyncMock()
    repository = OutboxRepository(session)

    before = datetime.now(UTC)
    await repository.mark_failed(
        event,
        "temporary error",
        max_attempts=MAX_OUTBOX_ATTEMPTS,
    )

    assert event.attempts == 2
    assert event.status == "pending"
    assert event.last_error == "temporary error"
    assert event.next_attempt_at > before


@pytest.mark.anyio
async def test_repository_mark_failed_marks_failed_at_max():
    from app.modules.outbox.repository import OutboxRepository

    event = _make_event(
        "00000000-0000-0000-0000-000000000004",
        attempts=MAX_OUTBOX_ATTEMPTS - 1,
    )
    session = AsyncMock()
    repository = OutboxRepository(session)

    await repository.mark_failed(
        event,
        "fatal error",
        max_attempts=MAX_OUTBOX_ATTEMPTS,
    )

    assert event.attempts == MAX_OUTBOX_ATTEMPTS
    assert event.status == "failed"
    assert event.last_error == "fatal error"


@pytest.mark.anyio
async def test_automation_settings_update_produces_two_events():
    from app.bootstrap import ApplicationFactory
    from app.modules.automation.schemas import AutomationSettingsUpdate

    session = AsyncMock()
    service = ApplicationFactory(session).create_automation_service()

    mock_settings = MagicMock()
    mock_settings.enabled = False
    mock_settings.run_hour = 10
    mock_settings.run_minute = 0
    mock_settings.post_limit = 10
    mock_settings.timezone_offset_minutes = 0
    mock_settings.last_run_at = None

    service.repository.get_or_create_settings = AsyncMock(
        return_value=mock_settings
    )
    service.tasks.add_audit = AsyncMock()
    service.outbox.add_event = AsyncMock()
    service._settings_response = AsyncMock(return_value={})

    payload_first = AutomationSettingsUpdate(
        enabled=False,
        runHour=10,
        runMinute=0,
        postLimit=10,
        timezoneOffsetMinutes=0,
    )
    payload_second = AutomationSettingsUpdate(
        enabled=True,
        runHour=12,
        runMinute=30,
        postLimit=20,
        timezoneOffsetMinutes=60,
    )

    await service.update_settings("user-1", payload_first)
    await service.update_settings("user-1", payload_second)

    assert service.outbox.add_event.call_count == 2
    assert all(
        call.kwargs["event_type"]
        == "task.automation_settings_updated"
        for call in service.outbox.add_event.call_args_list
    )


@pytest.mark.anyio
async def test_publisher_does_not_create_or_stop_producer():
    repo = AsyncMock()
    repo.claim_batch.return_value = []
    producer = AsyncMock()

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=False,
    )
    assert await publisher.publish_batch() == 0
    producer.stop.assert_not_called()


@pytest.mark.anyio
async def test_publisher_uses_explicit_topic_names():
    message = _make_message(
        "00000000-0000-0000-0000-000000000005"
    )
    repo = AsyncMock()
    repo.claim_batch.return_value = [message]
    producer = AsyncMock()
    custom_topic = "custom.tasks.events"

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic=custom_topic,
        dlq_topic="custom.tasks.dlq",
        publish_enabled=True,
    )
    await publisher.publish_batch()

    call_args = producer.send_and_wait.call_args
    assert call_args is not None
    assert call_args.args[0] == custom_topic


@pytest.mark.anyio
async def test_publisher_uses_explicit_dlq_topic():
    message = _make_message(
        "00000000-0000-0000-0000-000000000006",
        attempts=MAX_OUTBOX_ATTEMPTS - 1,
    )
    repo = AsyncMock()

    async def mark_failed_side_effect(event_id, error):
        message.attempts += 1
        return message.attempts >= MAX_OUTBOX_ATTEMPTS

    repo.mark_failed = AsyncMock(side_effect=mark_failed_side_effect)
    repo.claim_batch.return_value = [message]
    producer = AsyncMock()
    send_calls = []

    async def send_and_wait_side_effect(topic, **kwargs):
        send_calls.append(topic)
        if topic == "parsevk.tasks.events":
            raise RuntimeError("kafka down")

    producer.send_and_wait = AsyncMock(
        side_effect=send_and_wait_side_effect
    )
    custom_dlq = "custom.tasks.dlq"
    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic=custom_dlq,
        publish_enabled=True,
    )
    await publisher.publish_batch()

    assert send_calls == ["parsevk.tasks.events", custom_dlq]
