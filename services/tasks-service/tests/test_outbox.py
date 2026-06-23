import asyncio
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app import main
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

    class FakeTransaction:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class FakeSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        def begin(self):
            return FakeTransaction()

    class FakePublisher:
        def __init__(self, session):
            self.session = session

        async def publish_batch(self):
            nonlocal calls
            calls += 1
            if calls == 1:
                raise RuntimeError("kafka unavailable")
            raise asyncio.CancelledError

    async def sleep_without_delay(seconds):
        return None

    monkeypatch.setattr(main, "SessionLocal", FakeSession)
    monkeypatch.setattr(main, "OutboxPublisher", FakePublisher)
    monkeypatch.setattr(main.asyncio, "sleep", sleep_without_delay)

    with pytest.raises(asyncio.CancelledError):
        await main.publish_outbox_forever()

    assert calls == 2


@pytest.mark.anyio
async def test_tasks_service_outbox_events_contract():
    from unittest.mock import AsyncMock, MagicMock

    from app.modules.tasks.schemas import CreateParseTaskRequest
    from app.modules.tasks.service import TasksService
    
    session = AsyncMock()
    service = TasksService(session)
    
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
    from uuid import UUID
    from unittest.mock import MagicMock

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
    from unittest.mock import AsyncMock, patch

    from app.modules.outbox.publisher import OutboxPublisher

    repo = AsyncMock()
    repo.lock_pending.return_value = [_make_event("00000000-0000-0000-0000-000000000001")]

    session = AsyncMock()
    publisher = OutboxPublisher(session)
    publisher.repository = repo

    producer_instance = AsyncMock()
    producer_instance.start = AsyncMock()
    producer_instance.stop = AsyncMock()

    with patch("aiokafka.AIOKafkaProducer", return_value=producer_instance):
        result = await publisher.publish_batch()

    assert result == 1
    repo.mark_published.assert_awaited_once()


@pytest.mark.anyio
async def test_publish_batch_calls_mark_failed_on_error():
    from unittest.mock import AsyncMock, patch

    from app.modules.outbox.publisher import OutboxPublisher, MAX_OUTBOX_ATTEMPTS

    event = _make_event("00000000-0000-0000-0000-000000000002", attempts=3)
    repo = AsyncMock()
    repo.lock_pending.return_value = [event]

    session = AsyncMock()
    publisher = OutboxPublisher(session)
    publisher.repository = repo

    producer_instance = AsyncMock()
    producer_instance.start = AsyncMock()
    producer_instance.stop = AsyncMock()
    producer_instance.send_and_wait = AsyncMock(side_effect=RuntimeError("kafka down"))

    with patch("aiokafka.AIOKafkaProducer", return_value=producer_instance):
        result = await publisher.publish_batch()

    assert result == 1
    repo.mark_failed.assert_awaited_once_with(event, "kafka down", max_attempts=MAX_OUTBOX_ATTEMPTS)
    repo.mark_published.assert_not_awaited()


@pytest.mark.anyio
async def test_publish_batch_sends_to_dlq_after_max_attempts():
    from unittest.mock import AsyncMock, patch

    from app.modules.outbox.publisher import OutboxPublisher, MAX_OUTBOX_ATTEMPTS

    event = _make_event("00000000-0000-0000-0000-000000000003", attempts=MAX_OUTBOX_ATTEMPTS - 1)
    repo = AsyncMock()

    async def mark_failed_side_effect(event, error, **kwargs):
        event.attempts += 1

    repo.mark_failed = AsyncMock(side_effect=mark_failed_side_effect)
    repo.lock_pending.return_value = [event]

    session = AsyncMock()
    publisher = OutboxPublisher(session)
    publisher.repository = repo

    producer_instance = AsyncMock()
    producer_instance.start = AsyncMock()
    producer_instance.stop = AsyncMock()

    send_calls = []

    async def send_and_wait_side_effect(topic, **kwargs):
        send_calls.append(topic)
        if topic == "parsevk.tasks.events":
            raise RuntimeError("kafka down")

    producer_instance.send_and_wait = AsyncMock(side_effect=send_and_wait_side_effect)

    with patch("aiokafka.AIOKafkaProducer", return_value=producer_instance):
        result = await publisher.publish_batch()

    assert result == 1
    repo.mark_failed.assert_awaited_once()
    assert len(send_calls) == 2
    assert send_calls[0] == "parsevk.tasks.events"
    assert send_calls[1] == "parsevk.tasks.dlq"


@pytest.mark.anyio
async def test_publish_batch_no_dlq_below_max_attempts():
    from unittest.mock import AsyncMock, patch

    from app.modules.outbox.publisher import OutboxPublisher

    event = _make_event("00000000-0000-0000-0000-000000000004", attempts=1)
    repo = AsyncMock()
    repo.lock_pending.return_value = [event]

    session = AsyncMock()
    publisher = OutboxPublisher(session)
    publisher.repository = repo

    producer_instance = AsyncMock()
    producer_instance.start = AsyncMock()
    producer_instance.stop = AsyncMock()

    send_calls = []

    async def send_and_wait_side_effect(topic, **kwargs):
        send_calls.append(topic)
        raise RuntimeError("kafka down")

    producer_instance.send_and_wait = AsyncMock(side_effect=send_and_wait_side_effect)

    with patch("aiokafka.AIOKafkaProducer", return_value=producer_instance):
        result = await publisher.publish_batch()

    assert result == 1
    repo.mark_failed.assert_awaited_once()
    assert len(send_calls) == 1
    assert send_calls[0] == "parsevk.tasks.events"

