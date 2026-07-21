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
    consumer._consumer.commit.assert_awaited_once()


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
        messenger="whatsapp", message_id="m1", chat_id="c1"
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
