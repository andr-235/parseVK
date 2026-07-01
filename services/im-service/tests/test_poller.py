from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.modules.whappi.models import WappiChat


@pytest.fixture
def mock_repo():
    repo = MagicMock()
    repo.session = AsyncMock()
    repo.session.scalar = AsyncMock()
    repo.session.commit = AsyncMock()
    repo.session.rollback = AsyncMock()
    repo.upsert_group = AsyncMock()
    repo.upsert_message = AsyncMock(return_value=MagicMock())
    return repo


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
async def test_start_uses_db_timestamp(mock_repo, mock_wappi, mock_max):
    from app.modules.poller.service import WappiPoller

    ts = datetime(2025, 6, 1, 12, 0, 0, tzinfo=UTC)
    mock_repo.session.scalar.side_effect = [ts, None]

    poller = WappiPoller(repository=mock_repo, wappi_client=mock_wappi, max_client=mock_max)
    await poller.start()
    assert poller._last_poll["whatsapp"] == int(ts.timestamp())
    assert poller._last_poll["max"] is not None


@pytest.mark.asyncio
async def test_poll_messenger_processes_chats(mock_repo, mock_wappi, sample_chats):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.return_value = sample_chats
    mock_wappi.list_messages.return_value = [
        {"id": "m1", "body": "hello", "type": "text", "time": 1_700_000_000},
    ]

    with patch("app.modules.poller.service.process_chat_messages", new_callable=AsyncMock) as mock_process:
        mock_process.side_effect = [1, 0]
        poller = WappiPoller(repository=mock_repo, wappi_client=mock_wappi, max_client=mock_max)
        result = await poller.poll_messenger("whatsapp")
        assert result == 1
        mock_repo.upsert_group.assert_awaited()
        assert mock_process.await_count == 2
        mock_repo.session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_poll_messenger_skips_known_chat_ids(mock_repo, mock_wappi):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.return_value = [
        WappiChat({"id": "status@broadcast"}),
        WappiChat({"id": "333", "name": "Good"}),
    ]

    with patch("app.modules.poller.service.process_chat_messages", new_callable=AsyncMock) as mock_process:
        mock_process.return_value = 0
        poller = WappiPoller(repository=mock_repo, wappi_client=mock_wappi, max_client=mock_max)
        result = await poller.poll_messenger("whatsapp")
        assert result == 0
        # upsert_group called only for non-skipped chat
        mock_repo.upsert_group.assert_awaited_with("whatsapp", "333", "Good", {"id": "333", "name": "Good"})


@pytest.mark.asyncio
async def test_poll_messenger_handles_list_chats_error(mock_repo, mock_wappi):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.side_effect = ConnectionError("API unreachable")

    poller = WappiPoller(repository=mock_repo, wappi_client=mock_wappi, max_client=mock_max)
    result = await poller.poll_messenger("whatsapp")
    assert result == 0
    mock_repo.upsert_group.assert_not_called()


@pytest.mark.asyncio
async def test_poll_messenger_handles_list_messages_error(mock_repo, mock_wappi, sample_chats):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.return_value = [sample_chats[0]]
    mock_wappi.list_messages.side_effect = ConnectionError("Timeout")

    with patch("app.modules.poller.service.process_chat_messages", new_callable=AsyncMock) as mock_process:
        poller = WappiPoller(repository=mock_repo, wappi_client=mock_wappi, max_client=mock_max)
        result = await poller.poll_messenger("whatsapp")
        assert result == 0
        mock_repo.upsert_group.assert_awaited_once()
        mock_process.assert_not_called()
        mock_repo.session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_poll_messenger_commit_failure(mock_repo, mock_wappi, sample_chats):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.return_value = [sample_chats[0]]
    mock_wappi.list_messages.return_value = [{"id": "m1"}]
    mock_repo.session.commit.side_effect = RuntimeError("DB error")

    with patch("app.modules.poller.service.process_chat_messages", new_callable=AsyncMock) as mock_process:
        mock_process.return_value = 1
        poller = WappiPoller(repository=mock_repo, wappi_client=mock_wappi, max_client=mock_max)
        result = await poller.poll_messenger("whatsapp")
        assert result == 1  # count is returned even if commit fails
        mock_repo.session.rollback.assert_awaited_once()


@pytest.mark.asyncio
async def test_run_polls_both_messengers(mock_repo, mock_wappi, mock_max):
    from app.modules.poller.service import WappiPoller

    mock_wappi.list_chats.return_value = []
    mock_max.list_chats.return_value = []

    with patch("app.modules.poller.service.process_chat_messages", new_callable=AsyncMock) as mock_process:
        mock_process.return_value = 0
        poller = WappiPoller(repository=mock_repo, wappi_client=mock_wappi, max_client=mock_max)
        await poller.run()
        mock_wappi.list_chats.assert_awaited_once()
        mock_max.list_chats.assert_awaited_once()


@pytest.mark.asyncio
async def test_close_propagates_to_clients(mock_repo, mock_wappi, mock_max):
    from app.modules.poller.service import WappiPoller

    poller = WappiPoller(repository=mock_repo, wappi_client=mock_wappi, max_client=mock_max)
    await poller.close()
    mock_wappi.close.assert_awaited_once()
    mock_max.close.assert_awaited_once()
