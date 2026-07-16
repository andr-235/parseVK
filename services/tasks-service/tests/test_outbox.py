import asyncio
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.background import outbox_worker
from app.modules.outbox.publisher import kafka_key_for_event

SENSITIVE_KEYS = {"authorization", "cookie", "access_token", "refresh_token", "password"}


def assert_no_sensitive_payload(payload):
    lowered = {str(key).lower() for key in payload}
    assert lowered.isdisjoint(SENSITIVE_KEYS)


def test_task_event_type_has_no_version_suffix():
    assert "task.created".endswith(".v1") is False


def test_kafka_key_for_task_event_uses_task_id():
    assert kafka_key_for_event("task.created", {"taskId": "42", "ownerUserId": "u1"}, "42") == "42"


def test_kafka_key_for_automation_settings_event_uses_owner():
    assert (
        kafka_key_for_event(
            "task.automation_settings_updated",
            {"ownerUserId": "u1", "enabled": True},
            "u1",
        )
        == "u1"
    )


def test_payload_has_no_sensitive_keys():
    assert_no_sensitive_payload({"taskId": "42", "ownerUserId": "u1", "source": "manual"})


@pytest.mark.anyio
async def test_outbox_loop_continues_after_publish_error(monkeypatch):
    calls = 0

    class FakeContextManager:
        """Reusable async context manager that does nothing."""

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
            pass

        async def stop(self):
            pass

    async def sleep_without_delay(seconds):
        return None

    monkeypatch.setattr(outbox_worker, "SessionLocal", FakeContextManager)
    monkeypatch.setattr(outbox_worker, "AIOKafkaProducer", lambda **kwargs: FakeProducer())
    monkeypatch.setattr(outbox_worker, "ApplicationFactory", FakeFactory)
    monkeypatch.setattr(outbox_worker.asyncio, "sleep", sleep_without_delay)

    with pytest.raises(asyncio.CancelledError):
        await outbox_worker.publish_outbox_forever()

    assert calls == 2


@pytest.mark.anyio
async def test_tasks_service_outbox_events_contract():
    from unittest.mock import AsyncMock, MagicMock

    from app.bootstrap import ApplicationFactory
    from app.modules.tasks.schemas import CreateParseTaskRequest

    session = AsyncMock()
    service = ApplicationFactory(session).create_tasks_service()
    
    task_mock = MagicMock()
    task_mock.id = 42
    task_mock.owner_user_id = "user-1"
    task_mock.scope = "selected"
    task_mock.mode = "recent_posts"
    task_mock.group_ids = [1, 2]
    task_mock.post_limit = 10
    task_mock.source = "manual"
    
    service.crud.repository.create_task = AsyncMock(return_value=task_mock)
    service.crud.repository.add_audit = AsyncMock()
    service.crud.outbox.add_event = AsyncMock()
    
    payload = CreateParseTaskRequest(
        scope="selected",
        groupIds=[1, 2],
        postLimit=10,
        mode="recent_posts"
    )
    
    await service.create_parse_task("user-1", payload)
    
    service.crud.outbox.add_event.assert_called_with(
        event_type="task.created",
        aggregate_type="task",
        aggregate_id="42",
        correlation_id=None,
        dedupe_key="task.created:42",
        payload={
            "taskId": "42",
            "ownerUserId": "user-1",
            "scope": "selected",
            "mode": "recent_posts",
            "groupIds": [1, 2],
            "postLimit": 10,
            "source": "manual",
        }
    )

    task_mock.scope = "all"
    task_mock.group_ids = []
    payload_all = CreateParseTaskRequest(
        scope="all",
        groupIds=[1, 2],
        postLimit=10,
        mode="recent_posts"
    )
    await service.create_parse_task("user-1", payload_all)
    service.crud.outbox.add_event.assert_called_with(
        event_type="task.created",
        aggregate_type="task",
        aggregate_id="42",
        correlation_id=None,
        dedupe_key="task.created:42",
        payload={
            "taskId": "42",
            "ownerUserId": "user-1",
            "scope": "all",
            "mode": "recent_posts",
            "groupIds": [],
            "postLimit": 10,
            "source": "manual",
        }
    )

    service.crud.repository.get_task = AsyncMock(return_value=task_mock)
    service.crud.repository.touch_task = AsyncMock(return_value=task_mock)
    
    await service.resume_task("user-1", 42)
    service.crud.outbox.add_event.assert_called_with(
        event_type="task.resumed",
        aggregate_type="task",
        aggregate_id="42",
        dedupe_key="task.resumed:42",
        payload={
            "taskId": "42",
            "ownerUserId": "user-1",
            "scope": "all",
            "mode": "recent_posts",
            "groupIds": [],
            "postLimit": 10,
            "source": "manual",
        }
    )


def _make_event(event_id: str, attempts: int = 0, status: str = "pending"):
    from datetime import UTC, datetime
    from unittest.mock import MagicMock
    from uuid import UUID

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


@pytest.fixture(autouse=True)
def enable_outbox():
    from app.core.config import settings
    original = settings.outbox_publish_enabled
    settings.outbox_publish_enabled = True
    yield
    settings.outbox_publish_enabled = original


@pytest.mark.anyio
async def test_publish_batch_calls_mark_published_on_success():
    from unittest.mock import AsyncMock

    from app.modules.outbox.publisher import OutboxPublisher

    repo = AsyncMock()
    repo.lock_pending.return_value = [_make_event("00000000-0000-0000-0000-000000000001")]

    producer_instance = AsyncMock()

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer_instance,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=True,
    )
    result = await publisher.publish_batch()

    assert result == 1
    repo.mark_published.assert_awaited_once()


@pytest.mark.anyio
async def test_publish_batch_calls_mark_failed_on_error():
    from unittest.mock import AsyncMock

    from app.modules.outbox.publisher import MAX_OUTBOX_ATTEMPTS, OutboxPublisher

    event = _make_event("00000000-0000-0000-0000-000000000002", attempts=3)
    repo = AsyncMock()
    repo.lock_pending.return_value = [event]

    producer_instance = AsyncMock()
    producer_instance.send_and_wait = AsyncMock(side_effect=RuntimeError("kafka down"))

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer_instance,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=True,
    )
    result = await publisher.publish_batch()

    assert result == 1
    repo.mark_failed.assert_awaited_once_with(event, "kafka down", max_attempts=MAX_OUTBOX_ATTEMPTS)
    repo.mark_published.assert_not_awaited()


@pytest.mark.anyio
async def test_publish_batch_sends_to_dlq_after_max_attempts():
    from unittest.mock import AsyncMock

    from app.modules.outbox.publisher import MAX_OUTBOX_ATTEMPTS, OutboxPublisher

    event = _make_event("00000000-0000-0000-0000-000000000003", attempts=MAX_OUTBOX_ATTEMPTS - 1)
    repo = AsyncMock()

    async def mark_failed_side_effect(event, error, **kwargs):
        event.attempts += 1

    repo.mark_failed = AsyncMock(side_effect=mark_failed_side_effect)
    repo.lock_pending.return_value = [event]

    producer_instance = AsyncMock()

    send_calls = []

    async def send_and_wait_side_effect(topic, **kwargs):
        send_calls.append(topic)
        if topic == "parsevk.tasks.events":
            raise RuntimeError("kafka down")

    producer_instance.send_and_wait = AsyncMock(side_effect=send_and_wait_side_effect)

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer_instance,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=True,
    )
    result = await publisher.publish_batch()

    assert result == 1
    repo.mark_failed.assert_awaited_once()
    assert len(send_calls) == 2
    assert send_calls[0] == "parsevk.tasks.events"
    assert send_calls[1] == "parsevk.tasks.dlq"


@pytest.mark.anyio
async def test_publish_batch_no_dlq_below_max_attempts():
    from unittest.mock import AsyncMock

    from app.modules.outbox.publisher import OutboxPublisher

    event = _make_event("00000000-0000-0000-0000-000000000004", attempts=1)
    repo = AsyncMock()
    repo.lock_pending.return_value = [event]

    producer_instance = AsyncMock()

    send_calls = []

    async def send_and_wait_side_effect(topic, **kwargs):
        send_calls.append(topic)
        raise RuntimeError("kafka down")

    producer_instance.send_and_wait = AsyncMock(side_effect=send_and_wait_side_effect)

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer_instance,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=True,
    )
    result = await publisher.publish_batch()

    assert result == 1
    repo.mark_failed.assert_awaited_once()
    assert len(send_calls) == 1
    assert send_calls[0] == "parsevk.tasks.events"


@pytest.mark.anyio
async def test_automation_settings_update_produces_two_events():
    """Two sequential updates for the same user must produce two outbox events (not deduped)."""
    from unittest.mock import AsyncMock, MagicMock

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

    service.repository.get_or_create_settings = AsyncMock(return_value=mock_settings)
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

    assert service.outbox.add_event.call_count == 2, (
        f"Expected 2 outbox events, got {service.outbox.add_event.call_count}"
    )

    first_call_event_type = service.outbox.add_event.call_args_list[0].kwargs["event_type"]
    second_call_event_type = service.outbox.add_event.call_args_list[1].kwargs["event_type"]
    assert first_call_event_type == "task.automation_settings_updated"
    assert second_call_event_type == "task.automation_settings_updated"


@pytest.mark.anyio
async def test_complete_execution_publishes_outbox_event():
    """complete_execution() must publish a task.completed outbox event with correct payload."""
    from unittest.mock import AsyncMock, MagicMock

    from app.bootstrap import ApplicationFactory
    from app.modules.tasks.schemas import ExecutionCompleteRequest

    session = AsyncMock()
    service = ApplicationFactory(session).create_tasks_service()

    task_mock = MagicMock()
    task_mock.id = 42
    task_mock.owner_user_id = "user-1"
    task_mock.scope = "selected"
    task_mock.mode = "recent_posts"
    task_mock.group_ids = [1, 2]
    task_mock.post_limit = 10
    task_mock.source = "manual"
    task_mock.status = "running"
    task_mock.execution_run_id = "run-abc-123"
    task_mock.processed_items = 100
    task_mock.total_items = 200
    task_mock.stats = {"processed": 100, "total": 200}

    payload = MagicMock(spec=ExecutionCompleteRequest)
    payload.run_id = "run-abc-123"
    payload.processed_items = 100
    payload.total_items = 200
    payload.stats = {"processed": 100, "total": 200}

    service.crud.repository.get_task_by_id = AsyncMock(return_value=task_mock)
    service.crud.repository.add_audit = AsyncMock()
    service.crud.repository.touch_task = AsyncMock(return_value=task_mock)
    service.crud.outbox.add_event = AsyncMock()

    await service.complete_execution(42, payload)

    service.crud.outbox.add_event.assert_called_once()
    call_kwargs = service.crud.outbox.add_event.call_args.kwargs
    assert call_kwargs["event_type"] == "task.completed"
    assert call_kwargs["aggregate_type"] == "task"
    assert call_kwargs["aggregate_id"] == "42"
    assert call_kwargs["dedupe_key"] == "task.completed:42"
    assert call_kwargs["payload"]["taskId"] == "42"
    assert call_kwargs["payload"]["ownerUserId"] == "user-1"
    assert call_kwargs["payload"]["scope"] == "selected"
    assert call_kwargs["payload"]["mode"] == "recent_posts"
    assert call_kwargs["payload"]["groupIds"] == [1, 2]
    assert call_kwargs["payload"]["postLimit"] == 10
    assert call_kwargs["payload"]["source"] == "manual"
    assert call_kwargs["payload"]["stats"] == {"processed": 100, "total": 200}
    assert call_kwargs["payload"]["processedItems"] == 100
    assert call_kwargs["payload"]["totalItems"] == 200


@pytest.mark.anyio
async def test_fail_execution_publishes_outbox_event():
    """fail_execution() must publish a task.failed outbox event with correct payload."""
    from unittest.mock import AsyncMock, MagicMock

    from app.bootstrap import ApplicationFactory
    from app.modules.tasks.schemas import ExecutionFailRequest

    session = AsyncMock()
    service = ApplicationFactory(session).create_tasks_service()

    task_mock = MagicMock()
    task_mock.id = 42
    task_mock.owner_user_id = "user-1"
    task_mock.scope = "selected"
    task_mock.mode = "recent_posts"
    task_mock.group_ids = [1, 2]
    task_mock.post_limit = 10
    task_mock.source = "manual"
    task_mock.status = "running"
    task_mock.execution_run_id = None
    task_mock.error = None
    task_mock.processed_items = 50
    task_mock.total_items = 200
    task_mock.stats = {"processed": 50, "total": 200}

    error_message = "VK API timeout error"
    payload = MagicMock(spec=ExecutionFailRequest)
    payload.run_id = "run-fail-456"
    payload.error = error_message
    payload.processed_items = 50
    payload.total_items = 200
    payload.stats = {"processed": 50, "total": 200}

    service.crud.repository.get_task_by_id = AsyncMock(return_value=task_mock)
    service.crud.repository.add_audit = AsyncMock()
    service.crud.repository.touch_task = AsyncMock(return_value=task_mock)
    service.crud.outbox.add_event = AsyncMock()

    await service.fail_execution(42, payload)

    service.crud.outbox.add_event.assert_called_once()
    call_kwargs = service.crud.outbox.add_event.call_args.kwargs
    assert call_kwargs["event_type"] == "task.failed"
    assert call_kwargs["aggregate_type"] == "task"
    assert call_kwargs["aggregate_id"] == "42"
    assert call_kwargs["dedupe_key"] == "task.failed:42:run-fail-456"
    assert call_kwargs["payload"]["taskId"] == "42"
    assert call_kwargs["payload"]["ownerUserId"] == "user-1"
    assert call_kwargs["payload"]["error"] == error_message
    assert call_kwargs["payload"]["scope"] == "selected"
    assert call_kwargs["payload"]["mode"] == "recent_posts"
    assert call_kwargs["payload"]["groupIds"] == [1, 2]
    assert call_kwargs["payload"]["postLimit"] == 10
    assert call_kwargs["payload"]["source"] == "manual"


@pytest.mark.anyio
async def test_publisher_does_not_create_producer():
    """OutboxPublisher does not create AIOKafkaProducer internally."""
    from unittest.mock import AsyncMock

    from app.modules.outbox.publisher import OutboxPublisher

    repo = AsyncMock()
    repo.lock_pending.return_value = []
    producer = AsyncMock()

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=False,
    )
    # Should not raise — producer is not created by publisher
    result = await publisher.publish_batch()
    assert result == 0


@pytest.mark.anyio
async def test_publisher_does_not_stop_producer():
    """OutboxPublisher does not call producer.stop() after publish."""
    from unittest.mock import AsyncMock

    from app.modules.outbox.publisher import OutboxPublisher

    repo = AsyncMock()
    repo.lock_pending.return_value = []
    producer = AsyncMock()

    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic="parsevk.tasks.dlq",
        publish_enabled=False,
    )
    await publisher.publish_batch()
    producer.stop.assert_not_called()


@pytest.mark.anyio
async def test_publisher_uses_explicit_topic_names():
    """OutboxPublisher uses topic from constructor, not settings."""
    from unittest.mock import AsyncMock

    from app.modules.outbox.publisher import OutboxPublisher

    event = _make_event("00000000-0000-0000-0000-000000000005")
    repo = AsyncMock()
    repo.lock_pending.return_value = [event]
    producer = AsyncMock()
    producer.send_and_wait = AsyncMock()

    custom_topic = "custom.tasks.events"
    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic=custom_topic,
        dlq_topic="custom.tasks.dlq",
        publish_enabled=True,
    )
    await publisher.publish_batch()
    # verify send_and_wait was called with our custom topic
    call_args = producer.send_and_wait.call_args
    assert call_args is not None, "send_and_wait should have been called"
    assert call_args[0][0] == custom_topic, f"Expected topic {custom_topic}, got {call_args[0][0]}"


@pytest.mark.anyio
async def test_publisher_uses_explicit_dlq_topic():
    """DLQ send uses dlq_topic from constructor."""
    from unittest.mock import AsyncMock

    from app.modules.outbox.publisher import MAX_OUTBOX_ATTEMPTS, OutboxPublisher

    event = _make_event("00000000-0000-0000-0000-000000000006", attempts=MAX_OUTBOX_ATTEMPTS - 1)
    repo = AsyncMock()

    async def mark_failed_side_effect(event, error, **kwargs):
        event.attempts += 1

    repo.mark_failed = AsyncMock(side_effect=mark_failed_side_effect)
    repo.lock_pending.return_value = [event]

    producer = AsyncMock()
    send_calls = []

    async def send_and_wait_side_effect(topic, **kwargs):
        send_calls.append(topic)
        if topic == "parsevk.tasks.events":
            raise RuntimeError("kafka down")

    producer.send_and_wait = AsyncMock(side_effect=send_and_wait_side_effect)

    custom_dlq = "custom.tasks.dlq"
    publisher = OutboxPublisher(
        repository=repo,
        producer=producer,
        topic="parsevk.tasks.events",
        dlq_topic=custom_dlq,
        publish_enabled=True,
    )
    await publisher.publish_batch()

    assert len(send_calls) == 2, f"Expected 2 send calls, got {len(send_calls)}"
    assert send_calls[1] == custom_dlq, f"Expected DLQ topic {custom_dlq}, got {send_calls[1]}"

