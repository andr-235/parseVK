from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.modules.whappi.models import WappiChat


@pytest.fixture
def mock_repo():
    repo = MagicMock()
    repo.upsert_group = AsyncMock()
    repo.upsert_message = AsyncMock(return_value=MagicMock())
    return repo


@pytest.fixture
def mock_session():
    session = AsyncMock()

    begin_cm = AsyncMock()
    begin_cm.__aenter__.return_value = None
    begin_cm.__aexit__.return_value = None
    # MagicMock is required so that calling begin() returns the context manager directly,
    # not a coroutine produced by AsyncMock.__call__.
    session.begin = MagicMock(return_value=begin_cm)

    session_cm = AsyncMock()
    session_cm.__aenter__.return_value = session
    session_cm.__aexit__.return_value = None

    return session, session_cm


@pytest.fixture
def mock_session_factory(mock_session):
    _, session_cm = mock_session
    factory = MagicMock(return_value=session_cm)
    return factory


@pytest.fixture
def mock_wappi():
    client = MagicMock()
    client.list_chats = AsyncMock()
    client.list_messages = AsyncMock()
    client.close = AsyncMock()
    return client


@pytest.fixture
def mock_max():
    client = MagicMock()
    client.list_chats = AsyncMock()
    client.list_messages = AsyncMock()
    client.close = AsyncMock()
    return client


@pytest.fixture
def sample_chats():
    return [
        WappiChat({"id": "111", "name": "Chat A"}),
        WappiChat({"id": "222", "name": "Chat B"}),
    ]


@pytest.mark.asyncio
async def test_start_uses_cursor_when_present(mock_session, mock_session_factory, mock_wappi, mock_max):
    from app.db.models import ImMessengerCursor
    from app.modules.poller.service import WappiPoller

    session, _ = mock_session
    session.get.side_effect = [
        ImMessengerCursor(messenger="whatsapp", last_poll=1_700_000_000),
        ImMessengerCursor(messenger="max", last_poll=1_700_000_001),
    ]

    poller = WappiPoller(session_factory=mock_session_factory, wappi_client=mock_wappi, max_client=mock_max)
    await poller.start()

    assert poller._last_poll["whatsapp"] == 1_700_000_000
    assert poller._last_poll["max"] == 1_700_000_001
    assert session.scalar.await_count == 0


@pytest.mark.asyncio
async def test_start_fallback_to_db_timestamp(mock_session, mock_session_factory, mock_wappi, mock_max):
    from app.modules.poller.service import WappiPoller

    session, _ = mock_session
    session.get.return_value = None
    ts = datetime(2025, 6, 1, 12, 0, 0, tzinfo=UTC)
    session.scalar.side_effect = [ts, None]

    poller = WappiPoller(session_factory=mock_session_factory, wappi_client=mock_wappi, max_client=mock_max)
    await poller.start()

    assert poller._last_poll["whatsapp"] == int(ts.timestamp())
    assert poller._last_poll["max"] is not None


@pytest.mark.asyncio
async def test_poll_messenger_processes_chats(mock_session_factory, mock_repo, mock_wappi, sample_chats):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.return_value = sample_chats
    mock_wappi.list_messages.return_value = [
        {"id": "m1", "body": "hello", "type": "text", "time": 1_700_000_000},
    ]

    with patch("app.modules.poller.service.IngestionRepository", return_value=mock_repo):
        with patch("app.modules.poller.service.process_chat_messages", new_callable=AsyncMock) as mock_process:
            mock_process.side_effect = [1, 0]
            poller = WappiPoller(
                session_factory=mock_session_factory,
                wappi_client=mock_wappi,
                max_client=mock_max,
            )
            result, ok = await poller.poll_messenger("whatsapp")

    assert result == 1
    assert ok is True
    assert mock_session_factory.call_count == 2
    mock_repo.upsert_group.assert_awaited()
    assert mock_process.await_count == 2


@pytest.mark.asyncio
async def test_poll_messenger_skips_known_chat_ids(mock_session_factory, mock_repo, mock_wappi):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.return_value = [
        WappiChat({"id": "status@broadcast"}),
        WappiChat({"id": "333", "name": "Good"}),
    ]

    with patch("app.modules.poller.service.IngestionRepository", return_value=mock_repo):
        with patch("app.modules.poller.service.process_chat_messages", new_callable=AsyncMock) as mock_process:
            mock_process.return_value = 0
            poller = WappiPoller(
                session_factory=mock_session_factory,
                wappi_client=mock_wappi,
                max_client=mock_max,
            )
            result, ok = await poller.poll_messenger("whatsapp")

    assert result == 0
    assert ok is True
    # upsert_group called only for non-skipped chat
    mock_repo.upsert_group.assert_awaited_with("whatsapp", "333", "Good", {"id": "333", "name": "Good"})


@pytest.mark.asyncio
async def test_poll_messenger_handles_list_chats_error(mock_session_factory, mock_repo, mock_wappi):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.side_effect = ConnectionError("API unreachable")

    with patch("app.modules.poller.service.IngestionRepository", return_value=mock_repo):
        poller = WappiPoller(
            session_factory=mock_session_factory,
            wappi_client=mock_wappi,
            max_client=MagicMock(),
        )
        result, ok = await poller.poll_messenger("whatsapp")

    assert result == 0
    assert ok is False
    mock_repo.upsert_group.assert_not_called()
    mock_session_factory.assert_not_called()


@pytest.mark.asyncio
async def test_poll_messenger_handles_list_messages_error(mock_session_factory, mock_repo, mock_wappi, sample_chats):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.return_value = [sample_chats[0]]
    mock_wappi.list_messages.side_effect = ConnectionError("Timeout")

    with patch("app.modules.poller.service.IngestionRepository", return_value=mock_repo):
        with patch("app.modules.poller.service.process_chat_messages", new_callable=AsyncMock) as mock_process:
            poller = WappiPoller(
                session_factory=mock_session_factory,
                wappi_client=mock_wappi,
                max_client=MagicMock(),
            )
            result, ok = await poller.poll_messenger("whatsapp")

    assert result == 0
    assert ok is False
    mock_repo.upsert_group.assert_awaited_once()
    mock_process.assert_not_called()


@pytest.mark.asyncio
async def test_poll_messenger_process_failure_rolls_back(mock_session, mock_session_factory, mock_repo, mock_wappi, sample_chats):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.return_value = [sample_chats[0]]
    mock_wappi.list_messages.return_value = [{"id": "m1"}]

    _, session_cm = mock_session

    with patch("app.modules.poller.service.IngestionRepository", return_value=mock_repo):
        with patch("app.modules.poller.service.process_chat_messages", new_callable=AsyncMock) as mock_process:
            mock_process.side_effect = RuntimeError("Processing failed")
            poller = WappiPoller(
                session_factory=mock_session_factory,
                wappi_client=mock_wappi,
                max_client=MagicMock(),
            )
            result, ok = await poller.poll_messenger("whatsapp")

    assert result == 0
    assert ok is False
    # begin context manager should be entered and exited (rollback on exception)
    session_cm.__aenter__.assert_awaited_once()
    session_cm.__aexit__.assert_awaited_once()


@pytest.mark.asyncio
async def test_run_polls_both_messengers(mock_session_factory, mock_repo, mock_wappi, mock_max):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.return_value = []
    mock_max.list_chats.return_value = []

    with patch("app.modules.poller.service.IngestionRepository", return_value=mock_repo):
        poller = WappiPoller(
            session_factory=mock_session_factory,
            wappi_client=mock_wappi,
            max_client=mock_max,
        )
        await poller.run()

    mock_wappi.list_chats.assert_awaited_once()
    mock_max.list_chats.assert_awaited_once()


@pytest.mark.asyncio
async def test_close_propagates_to_clients(mock_session_factory, mock_wappi, mock_max):
    from app.modules.poller.service import WappiPoller

    poller = WappiPoller(
        session_factory=mock_session_factory,
        wappi_client=mock_wappi,
        max_client=mock_max,
    )
    await poller.close()
    mock_wappi.close.assert_awaited_once()
    mock_max.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_poll_messenger_sanitizes_group_data(mock_session_factory, mock_repo, mock_wappi):
    from app.modules.poller.service import WappiPoller

    bad_name = "Bad\x00Name"
    raw = {"id": "444", "name": bad_name}
    mock_wappi.list_chats.return_value = [WappiChat(raw)]
    mock_wappi.list_messages.return_value = []

    with patch("app.modules.poller.service.IngestionRepository", return_value=mock_repo):
        poller = WappiPoller(
            session_factory=mock_session_factory,
            wappi_client=mock_wappi,
            max_client=MagicMock(),
        )
        await poller.poll_messenger("whatsapp")

    mock_repo.upsert_group.assert_awaited_with("whatsapp", "444", "BadName", {"id": "444", "name": "BadName"})


@pytest.mark.asyncio
async def test_poll_messenger_one_session_per_chat(mock_session_factory, mock_repo, mock_wappi, sample_chats):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.return_value = sample_chats
    mock_wappi.list_messages.return_value = []

    with patch("app.modules.poller.service.IngestionRepository", return_value=mock_repo):
        poller = WappiPoller(
            session_factory=mock_session_factory,
            wappi_client=mock_wappi,
            max_client=MagicMock(),
        )
        await poller.poll_messenger("whatsapp")

    assert mock_session_factory.call_count == len(sample_chats)


async def _capture_emit_callback(mock_session_factory, mock_wappi, mock_repo):
    """Run poll_messenger with a single chat and capture the outbox callback."""
    from app.modules.poller.service import WappiPoller

    mock_outbox_repo = AsyncMock()
    captured_callback = None

    async def fake_process(*args, **kwargs):
        nonlocal captured_callback
        captured_callback = kwargs.get("emit_message_collected_fn")
        return 1

    with patch("app.modules.poller.service.OutboxRepository", return_value=mock_outbox_repo):
        with patch("app.modules.poller.service.IngestionRepository", return_value=mock_repo):
            with patch("app.modules.poller.service.process_chat_messages", side_effect=fake_process):
                poller = WappiPoller(
                    session_factory=mock_session_factory,
                    wappi_client=mock_wappi,
                    max_client=MagicMock(),
                )
                await poller.poll_messenger("whatsapp")

    assert captured_callback is not None
    return captured_callback, mock_outbox_repo


@pytest.mark.asyncio
async def test_poll_messenger_creates_event_version_2(mock_session_factory, mock_repo, mock_wappi, sample_chats, caplog):
    from app.modules.ingestion.mapper import NormalizedImMessage

    mock_wappi.list_chats.return_value = [sample_chats[0]]
    mock_wappi.list_messages.return_value = [{"id": "m1"}]

    callback, outbox_repo = await _capture_emit_callback(mock_session_factory, mock_wappi, mock_repo)

    normalized = NormalizedImMessage(
        messenger="whatsapp",
        external_id="m1",
        chat_id="111",
        chat_name="Chat A",
        author_id="u1",
        author_name="Alice",
        text="hello",
        content_url="https://example.com/img.jpg",
        content_type="image",
        created_at=datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC),
        raw={"id": "m1", "body": "hello"},
    )

    with caplog.at_level("INFO"):
        await callback(normalized)

    outbox_repo.add_event.assert_awaited_once()
    call_kwargs = outbox_repo.add_event.call_args.kwargs
    assert call_kwargs["event_version"] == 2
    assert "Emitting im.message_collected v2 for whatsapp:111:m1" in caplog.text


@pytest.mark.asyncio
async def test_poll_messenger_payload_matches_saved_im_message(mock_session_factory, mock_repo, mock_wappi, sample_chats):
    from app.modules.ingestion.mapper import NormalizedImMessage

    mock_wappi.list_chats.return_value = [sample_chats[0]]
    mock_wappi.list_messages.return_value = [{"id": "m1"}]

    callback, outbox_repo = await _capture_emit_callback(mock_session_factory, mock_wappi, mock_repo)

    created_at = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)
    normalized = NormalizedImMessage(
        messenger="whatsapp",
        external_id="m1",
        chat_id="111",
        chat_name="Chat A",
        author_id="u1",
        author_name="Alice",
        text="hello",
        content_url="https://example.com/img.jpg",
        content_type="image",
        created_at=created_at,
        raw={"id": "m1", "body": "hello"},
    )
    await callback(normalized)

    outbox_repo.add_event.assert_awaited_once()
    payload = outbox_repo.add_event.call_args.kwargs["payload"]
    assert payload == {
        "messenger": "whatsapp",
        "messageId": "m1",
        "chatId": "111",
        "chatName": "Chat A",
        "authorId": "u1",
        "authorName": "Alice",
        "text": "hello",
        "contentUrl": "https://example.com/img.jpg",
        "contentType": "image",
        "createdAt": created_at.isoformat(),
        "metadata": {"id": "m1", "body": "hello"},
    }


@pytest.mark.asyncio
async def test_poll_messenger_stable_dedupe_key(mock_session_factory, mock_repo, mock_wappi, sample_chats):
    from app.modules.ingestion.mapper import NormalizedImMessage

    mock_wappi.list_chats.return_value = [sample_chats[0]]
    mock_wappi.list_messages.return_value = [{"id": "m1"}]

    callback, outbox_repo = await _capture_emit_callback(mock_session_factory, mock_wappi, mock_repo)

    normalized = NormalizedImMessage(
        messenger="whatsapp",
        external_id="m1",
        chat_id="111",
        chat_name=None,
        author_id=None,
        author_name=None,
        text=None,
        content_url=None,
        content_type=None,
        created_at=None,
        raw={"id": "m1"},
    )
    await callback(normalized)

    outbox_repo.add_event.assert_awaited_once()
    call_kwargs = outbox_repo.add_event.call_args.kwargs
    assert call_kwargs["dedupe_key"] == "im.message_collected:whatsapp:111:m1"


@pytest.mark.asyncio
async def test_poll_messenger_empty_optional_fields_handled(mock_session_factory, mock_repo, mock_wappi, sample_chats, caplog):
    from app.modules.ingestion.mapper import NormalizedImMessage

    mock_wappi.list_chats.return_value = [sample_chats[0]]
    mock_wappi.list_messages.return_value = [{"id": "m1"}]

    callback, outbox_repo = await _capture_emit_callback(mock_session_factory, mock_wappi, mock_repo)

    normalized = NormalizedImMessage(
        messenger="whatsapp",
        external_id="m1",
        chat_id="111",
        chat_name=None,
        author_id=None,
        author_name=None,
        text=None,
        content_url=None,
        content_type=None,
        created_at=None,
        raw={"id": "m1"},
    )

    with caplog.at_level("INFO"):
        await callback(normalized)

    outbox_repo.add_event.assert_awaited_once()
    call_kwargs = outbox_repo.add_event.call_args.kwargs
    assert call_kwargs["event_version"] == 2
    assert call_kwargs["payload"] == {
        "messenger": "whatsapp",
        "messageId": "m1",
        "chatId": "111",
        "metadata": {"id": "m1"},
    }
    assert "Emitting im.message_collected v2 for whatsapp:111:m1" in caplog.text
