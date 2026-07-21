"""Unit tests for ReplayBatchProcessor."""

from contextlib import asynccontextmanager
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.modules.outbox.service import OutboxService
from app.modules.replay.processor import ReplayBatchProcessor, ReplayBatchResult


@pytest.fixture
def anyio_backend():
    return "asyncio"


@asynccontextmanager
async def _null_async_context():
    yield


def _make_session(messages=None, progress=None):
    session = AsyncMock()
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=None)
    session.begin = MagicMock(return_value=_null_async_context())
    session.scalar = AsyncMock(return_value=progress)

    class _ScalarResult:
        def __init__(self, data):
            self._data = data

        def __iter__(self):
            return iter(self._data)

        def all(self):
            return self._data

    session.scalars = AsyncMock(return_value=_ScalarResult(messages or []))
    session.execute = AsyncMock(return_value=MagicMock())
    return session


def _make_message(
    msg_id,
    *,
    messenger="whatsapp",
    external_id=None,
    chat_external_id=None,
    chat_name=None,
    author=None,
    text=None,
    content_url=None,
    content_type=None,
    metadata_raw=None,
    created_at=None,
):
    return SimpleNamespace(
        id=msg_id,
        messenger=messenger,
        external_id=f"msg_{msg_id}" if external_id is None else external_id,
        chat_external_id=f"chat_{msg_id}" if chat_external_id is None else chat_external_id,
        chat_name=chat_name,
        author=author,
        text=text,
        content_url=content_url,
        content_type=content_type,
        metadata_raw=metadata_raw,
        created_at=created_at,
    )


@pytest.mark.anyio
async def test_run_batch_empty_starts_from_zero():
    outbox = AsyncMock(spec=OutboxService)
    session = _make_session(messages=[], progress=None)
    factory = MagicMock(return_value=session)

    processor = ReplayBatchProcessor(factory, outbox)
    result = await processor.run_batch(batch_size=10)

    assert result == ReplayBatchResult(processed_count=0, last_im_message_id=0, has_more=False)
    outbox.emit_message_collected.assert_not_awaited()
    session.execute.assert_not_awaited()


@pytest.mark.anyio
async def test_run_batch_processes_messages_and_saves_progress():
    outbox = AsyncMock(spec=OutboxService)
    created_at = datetime.now(UTC)
    messages = [
        _make_message(1, chat_name="Chat A", author="Alice", text="hi", created_at=created_at),
        _make_message(2, chat_name="Chat B", author="Bob", content_url="https://x", content_type="image"),
    ]
    progress = SimpleNamespace(last_im_message_id=0)
    session = _make_session(messages=messages, progress=progress)
    factory = MagicMock(return_value=session)

    processor = ReplayBatchProcessor(factory, outbox)
    result = await processor.run_batch(batch_size=10)

    assert result.processed_count == 2
    assert result.last_im_message_id == 2
    assert result.has_more is False
    assert outbox.emit_message_collected.await_count == 2

    first_call = outbox.emit_message_collected.await_args_list[0].kwargs
    assert first_call["replay"] is True
    assert first_call["messenger"] == "whatsapp"
    assert first_call["message_id"] == "msg_1"
    assert first_call["chat_id"] == "chat_1"
    assert first_call["chat_name"] == "Chat A"
    assert first_call["author_name"] == "Alice"
    assert first_call["text"] == "hi"
    assert first_call["created_at"] == created_at

    session.execute.assert_awaited_once()


@pytest.mark.anyio
async def test_run_batch_resumes_from_existing_progress():
    outbox = AsyncMock(spec=OutboxService)
    progress = SimpleNamespace(last_im_message_id=5)
    session = _make_session(messages=[], progress=progress)
    factory = MagicMock(return_value=session)

    processor = ReplayBatchProcessor(factory, outbox)
    result = await processor.run_batch(batch_size=10)

    assert result.last_im_message_id == 5
    query = session.scalars.await_args[0][0]
    assert "im_messages.id > :id_1" in str(query)


@pytest.mark.anyio
async def test_run_batch_skips_invalid_rows():
    outbox = AsyncMock(spec=OutboxService)

    # Build messages manually to avoid _make_message's default fill-in
    def raw_msg(id, **overrides):
        defaults = dict(
            messenger="whatsapp", external_id=f"ext_{id}",
            chat_external_id=f"chat_{id}", chat_name=None,
            author=None, text=None, content_url=None,
            content_type=None, metadata_raw=None, created_at=None,
        )
        defaults.update(overrides)
        return SimpleNamespace(id=id, **defaults)

    messages = [
        raw_msg(1, external_id=None),         # null external_id → skip
        raw_msg(2, chat_external_id=""),      # empty chat_external_id → skip (falsy)
        raw_msg(3, messenger=None),           # null messenger → skip
        raw_msg(4),                           # valid → process
    ]
    session = _make_session(messages=messages, progress=None)
    factory = MagicMock(return_value=session)

    processor = ReplayBatchProcessor(factory, outbox)
    result = await processor.run_batch(batch_size=10)

    assert result.processed_count == 4  # still 4 total messages read
    assert outbox.emit_message_collected.await_count == 1  # only msg 4 processed
    outbox.emit_message_collected.assert_awaited_with(
        replay=True,
        messenger="whatsapp", message_id="ext_4", chat_id="chat_4",
        chat_name=None, author_name=None, text=None,
        content_url=None, content_type=None, raw=None, created_at=None,
    )


@pytest.mark.anyio
async def test_run_full_stops_when_no_more_messages():
    outbox = AsyncMock(spec=OutboxService)
    batch_call_count = 0

    async def fake_run_batch(*, batch_size):
        nonlocal batch_call_count
        batch_call_count += 1
        return ReplayBatchResult(processed_count=batch_size, last_im_message_id=batch_call_count, has_more=batch_call_count < 3)

    processor = ReplayBatchProcessor(MagicMock(), outbox)
    processor.run_batch = fake_run_batch

    await processor.run_full(batch_size=2)

    assert batch_call_count == 3


@pytest.mark.anyio
async def test_run_full_respects_max_batches():
    outbox = AsyncMock(spec=OutboxService)

    async def fake_run_batch(*, batch_size):
        return ReplayBatchResult(processed_count=batch_size, last_im_message_id=1, has_more=True)

    processor = ReplayBatchProcessor(MagicMock(), outbox)
    processor.run_batch = fake_run_batch

    await processor.run_full(batch_size=2, max_batches=5)

    assert outbox.emit_message_collected.await_count == 0


@pytest.mark.anyio
async def test_run_batch_has_more_when_batch_is_full():
    outbox = AsyncMock(spec=OutboxService)
    messages = [_make_message(i) for i in range(1, 3)]
    session = _make_session(messages=messages, progress=None)
    factory = MagicMock(return_value=session)

    processor = ReplayBatchProcessor(factory, outbox)
    result = await processor.run_batch(batch_size=2)

    assert result.has_more is True
    assert result.processed_count == 2


@pytest.mark.anyio
async def test_run_batch_resumable_multi_batch():
    """Run two batches of 100 across 250 rows, verify progress tracking and has_more."""
    outbox = AsyncMock(spec=OutboxService)
    
    # Batch 1: rows 1-100
    messages_batch1 = [_make_message(i) for i in range(1, 101)]
    progress1 = SimpleNamespace(last_im_message_id=0)
    session1 = _make_session(messages=messages_batch1, progress=progress1)
    
    # Batch 2: rows 101-200
    messages_batch2 = [_make_message(i) for i in range(101, 201)]
    progress2 = SimpleNamespace(last_im_message_id=100)
    session2 = _make_session(messages=messages_batch2, progress=progress2)
    
    factory = MagicMock(side_effect=[session1, session2])
    
    processor = ReplayBatchProcessor(factory, outbox)
    
    # First batch
    result1 = await processor.run_batch(batch_size=100)
    assert result1.processed_count == 100
    assert result1.last_im_message_id == 100
    assert result1.has_more is True
    assert outbox.emit_message_collected.await_count == 100
    
    # Second batch
    result2 = await processor.run_batch(batch_size=100)
    assert result2.processed_count == 100
    assert result2.last_im_message_id == 200
    assert result2.has_more is True
    assert outbox.emit_message_collected.await_count == 200


@pytest.mark.anyio
async def test_run_batch_passes_all_fields():
    """Verify all ImMessage fields are passed to emit_message_collected with correct mapping."""
    outbox = AsyncMock(spec=OutboxService)
    created_at = datetime.now(UTC)
    
    msg = _make_message(
        1,
        messenger="whatsapp",
        external_id="ext_msg_001",
        chat_external_id="ext_chat_001",
        chat_name="Test Group Chat",
        author="Alice Johnson",
        text="Hello world! This is a test message with full fields.",
        content_url="https://example.com/image.jpg",
        content_type="image",
        metadata_raw={"source": "replay", "media_id": "12345"},
        created_at=created_at,
    )
    
    session = _make_session(messages=[msg], progress=None)
    factory = MagicMock(return_value=session)
    
    processor = ReplayBatchProcessor(factory, outbox)
    result = await processor.run_batch(batch_size=10)
    
    assert result.processed_count == 1
    outbox.emit_message_collected.assert_awaited_once()
    kwargs = outbox.emit_message_collected.await_args.kwargs
    
    assert kwargs["replay"] is True
    assert kwargs["messenger"] == "whatsapp"
    assert kwargs["message_id"] == "ext_msg_001"
    assert kwargs["chat_id"] == "ext_chat_001"
    assert kwargs["chat_name"] == "Test Group Chat"
    assert kwargs["author_name"] == "Alice Johnson"
    assert kwargs["text"] == "Hello world! This is a test message with full fields."
    assert kwargs["content_url"] == "https://example.com/image.jpg"
    assert kwargs["content_type"] == "image"
    assert kwargs["raw"] == {"source": "replay", "media_id": "12345"}
    assert kwargs["created_at"] == created_at
