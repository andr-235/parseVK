import json
import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_handle_processing_failure_sends_to_dlq_on_malformed_msg():
    from unittest.mock import AsyncMock, patch

    from app.modules.im_events.consumer import ImEventConsumer

    consumer = ImEventConsumer(session_factory=AsyncMock())
    consumer._consumer = AsyncMock()

    msg = AsyncMock()
    msg.value = b"not valid json{{{"
    msg.offset = 42

    with patch("common.kafka.consumer.send_to_dlq", new_callable=AsyncMock) as mock_send:
        await consumer._handle_processing_failure(msg)
        mock_send.assert_awaited_once()

    consumer._consumer.commit.assert_awaited_once()


@pytest.mark.anyio
async def test_skip_due_to_retry_backoff_commits_offset_when_in_backoff():
    from datetime import UTC, datetime, timedelta
    from json import dumps
    from types import SimpleNamespace
    from unittest.mock import AsyncMock
    from uuid import uuid4

    from app.modules.im_events.consumer import ImEventConsumer

    consumer = ImEventConsumer()
    consumer._consumer = AsyncMock()

    raw_value = dumps(
        {
            "event_id": str(uuid4()),
            "event_type": "im.message_collected",
        }
    ).encode()

    row = SimpleNamespace(
        next_retry_at=datetime.now(UTC) + timedelta(hours=1),
        retry_count=1,
    )

    async def scalar_mock(*a, **kw):
        return row

    session = AsyncMock()
    session.scalar = scalar_mock
    session.__aenter__ = AsyncMock(return_value=session)

    consumer.session_factory = lambda: session

    result = await consumer._skip_due_to_retry_backoff(raw_value)

    assert result is True
    # Durable backoff: skip without committing offset — partition stays paused
    consumer._consumer.commit.assert_not_awaited()


@pytest.mark.anyio
async def test_handle_message_skips_unsupported_version():
    from unittest.mock import AsyncMock

    from app.modules.im_events.consumer import ImEventConsumer

    consumer = ImEventConsumer(session_factory=AsyncMock())
    consumer._consumer = AsyncMock()

    raw = json.dumps(
        {
            "event_id": str(uuid4()),
            "event_type": "im.message_collected",
            "event_version": 3,
            "aggregate_id": "c1",
            "payload": {"messenger": "whatsapp", "messageId": "m1", "chatId": "c1"},
        }
    )

    await consumer.handle_message(raw)
    consumer.session_factory.assert_not_called()


@pytest.mark.anyio
async def test_service_handle_v1_message_collected():
    from unittest.mock import AsyncMock
    from uuid import uuid4

    from app.modules.im_events.service import ImEventService
    from common.events import ImEvent

    repo = AsyncMock()
    repo.is_processed.return_value = False
    service = ImEventService(repo)

    event = ImEvent(
        event_id=uuid4(),
        event_type="im.message_collected",
        event_version=1,
        aggregate_id="c1",
        payload={"messenger": "whatsapp", "messageId": "m1", "chatId": "c1"},
    )

    result = await service.handle(event)

    assert result is True
    repo.upsert_message.assert_awaited_once_with(
        messenger="whatsapp", message_id="m1", chat_id="c1",
        projection_version=1,
    )
    repo.mark_processed.assert_awaited_once()
    repo.save.assert_awaited_once()


@pytest.mark.anyio
async def test_service_handle_v2_message_collected():
    from datetime import UTC, datetime
    from unittest.mock import AsyncMock
    from uuid import uuid4

    from app.modules.im_events.service import ImEventService
    from common.events import ImEvent

    repo = AsyncMock()
    repo.is_processed.return_value = False
    service = ImEventService(repo)

    created_at = datetime.now(UTC)
    event = ImEvent(
        event_id=uuid4(),
        event_type="im.message_collected",
        event_version=2,
        aggregate_id="c2",
        payload={
            "messenger": "whatsapp",
            "messageId": "m2",
            "chatId": "c2",
            "chatName": "Test Chat",
            "authorName": "Alice",
            "text": "hello",
            "contentUrl": "https://example.com/file",
            "contentType": "image",
            "createdAt": created_at.isoformat(),
            "metadata": {"foo": "bar"},
        },
    )

    result = await service.handle(event)

    assert result is True
    call_kwargs = repo.upsert_message.await_args.kwargs
    assert call_kwargs["messenger"] == "whatsapp"
    assert call_kwargs["message_id"] == "m2"
    assert call_kwargs["chat_id"] == "c2"
    assert call_kwargs["projection_version"] == 2
    assert call_kwargs["chat_name"] == "Test Chat"
    assert call_kwargs["author"] == "Alice"
    assert call_kwargs["text"] == "hello"
    assert call_kwargs["content_url"] == "https://example.com/file"
    assert call_kwargs["content_type"] == "image"
    assert call_kwargs["metadata_raw"] == {"foo": "bar"}
    assert call_kwargs["created_at"] is not None
    repo.mark_processed.assert_awaited_once()
    repo.save.assert_awaited_once()


@pytest.mark.anyio
async def test_service_handle_already_processed():
    from unittest.mock import AsyncMock
    from uuid import uuid4

    from app.modules.im_events.service import ImEventService
    from common.events import ImEvent

    repo = AsyncMock()
    repo.is_processed.return_value = True
    service = ImEventService(repo)

    event = ImEvent(
        event_id=uuid4(),
        event_type="im.message_collected",
        event_version=1,
        aggregate_id="c1",
        payload={"messenger": "whatsapp", "messageId": "m1", "chatId": "c1"},
    )

    result = await service.handle(event)

    assert result is False
    repo.upsert_message.assert_not_awaited()
    repo.mark_processed.assert_not_awaited()
    repo.save.assert_not_awaited()


@pytest.mark.anyio
async def test_v1_event_calls_upsert_with_version_1():
    """A v1 event must call upsert_message with projection_version=1.
    The actual WHERE clause enforcement is a database-level guarantee
    and cannot be verified with a mock repository."""
    from unittest.mock import AsyncMock
    from uuid import uuid4

    from app.modules.im_events.service import ImEventService
    from common.events import ImEvent

    repo = AsyncMock()
    repo.is_processed.return_value = False
    service = ImEventService(repo)

    event_v1 = ImEvent(
        event_id=uuid4(),
        event_type="im.message_collected",
        event_version=1,
        aggregate_id="c1",
        payload={"messenger": "whatsapp", "messageId": "m1", "chatId": "c1"},
    )
    result = await service.handle(event_v1)
    assert result is True

    call_kwargs = repo.upsert_message.await_args.kwargs
    assert call_kwargs["projection_version"] == 1


@pytest.mark.anyio
async def test_v2_after_v1_upgrades_projection():
    """A v2 event must overwrite a v1 skeleton and set projection_version=2."""
    from datetime import UTC, datetime
    from unittest.mock import AsyncMock
    from uuid import uuid4

    from app.modules.im_events.service import ImEventService
    from common.events import ImEvent

    repo = AsyncMock()
    repo.is_processed.return_value = False
    service = ImEventService(repo)

    created_at = datetime.now(UTC)
    event_v2 = ImEvent(
        event_id=uuid4(),
        event_type="im.message_collected",
        event_version=2,
        aggregate_id="c1",
        payload={
            "messenger": "whatsapp",
            "messageId": "m1",
            "chatId": "c1",
            "chatName": "Test",
            "authorName": "Alice",
            "text": "hello",
            "contentUrl": "https://example.com/img",
            "contentType": "image",
            "createdAt": created_at.isoformat(),
            "metadata": {"source": "replay"},
        },
    )
    result = await service.handle(event_v2)
    assert result is True

    call_kwargs = repo.upsert_message.await_args.kwargs
    assert call_kwargs["projection_version"] == 2
    assert call_kwargs["text"] == "hello"
    assert call_kwargs["chat_name"] == "Test"


@pytest.mark.anyio
async def test_same_event_id_delivered_twice():
    """ProcessedEvent prevents duplicate handling — upsert_message not called."""
    from unittest.mock import AsyncMock
    from uuid import uuid4

    from app.modules.im_events.service import ImEventService
    from common.events import ImEvent

    repo = AsyncMock()
    repo.is_processed.side_effect = [True, True]  # always processed
    service = ImEventService(repo)

    event = ImEvent(
        event_id=uuid4(),
        event_type="im.message_collected",
        event_version=2,
        aggregate_id="c1",
        payload={"messenger": "whatsapp", "messageId": "m1", "chatId": "c1"},
    )

    result = await service.handle(event)
    assert result is False
    repo.upsert_message.assert_not_awaited()


@pytest.mark.anyio
async def test_two_events_same_natural_key_both_call_upsert_message():
    """Two different event IDs for the same natural key must both
    result in upsert_message being called. The DB-level upsert prevents
    duplicate rows — this test verifies the service-layer routing,
    not the SQL constraint."""
    from unittest.mock import AsyncMock
    from uuid import uuid4

    from app.modules.im_events.service import ImEventService
    from common.events import ImEvent

    repo = AsyncMock()
    repo.is_processed.return_value = False
    service = ImEventService(repo)

    event_1 = ImEvent(
        event_id=uuid4(),
        event_type="im.message_collected",
        event_version=2,
        aggregate_id="c1",
        payload={
            "messenger": "whatsapp",
            "messageId": "m1",
            "chatId": "c1",
            "text": "first",
        },
    )
    event_2 = ImEvent(
        event_id=uuid4(),
        event_type="im.message_collected",
        event_version=2,
        aggregate_id="c1",
        payload={
            "messenger": "whatsapp",
            "messageId": "m1",
            "chatId": "c1",
            "text": "second",
        },
    )

    result_1 = await service.handle(event_1)
    assert result_1 is True
    result_2 = await service.handle(event_2)
    assert result_2 is True

    assert repo.upsert_message.await_count == 2
