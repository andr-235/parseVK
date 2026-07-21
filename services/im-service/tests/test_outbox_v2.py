from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.modules.outbox.repository import OutboxRepository
from app.modules.outbox.service import OutboxService


@pytest.fixture
def outbox_repo():
    """Create a mock OutboxRepository."""
    repo = MagicMock(spec=OutboxRepository)
    repo.add_event = AsyncMock()
    return repo


@pytest.fixture
def service(outbox_repo):
    """Create OutboxService with mocked repository."""
    return OutboxService(outbox_repo)


@pytest.mark.asyncio
async def test_emit_v1_minimal_payload(service, outbox_repo):
    """When no extra fields provided, should emit version 1 minimal payload."""
    await service.emit_message_collected(
        messenger="test_messenger",
        message_id="msg_001",
        chat_id="chat_001",
    )
    outbox_repo.add_event.assert_called_once()
    kwargs = outbox_repo.add_event.call_args.kwargs
    assert kwargs["event_type"] == "im.message_collected"
    # event_version not explicitly set → defaults to 1
    assert kwargs["event_version"] == 1  # check default from db model
    assert kwargs["payload"] == {"messenger": "test_messenger", "messageId": "msg_001", "chatId": "chat_001"}


@pytest.mark.asyncio
async def test_emit_v2_full_payload(service, outbox_repo):
    """When extra fields provided, should emit version 2 with full snapshot."""
    created_at = datetime.now(UTC)
    await service.emit_message_collected(
        messenger="whatsapp",
        message_id="msg_002",
        chat_id="chat_002",
        chat_name="My Group",
        author_id="user_123",
        author_name="John Doe",
        text="Hello world!",
        content_url="https://example.com/file.pdf",
        content_type="document",
        created_at=created_at,
        raw={"source": "wappi", "media_type": "pdf"},
    )
    outbox_repo.add_event.assert_called_once()
    kwargs = outbox_repo.add_event.call_args.kwargs

    assert kwargs["event_type"] == "im.message_collected"
    assert kwargs["event_version"] == 2
    assert kwargs["dedupe_key"] == "im.message_collected:whatsapp:chat_002:msg_002"
    assert kwargs["aggregate_id"] == "whatsapp:chat_002:msg_002"

    payload = kwargs["payload"]
    assert payload["messenger"] == "whatsapp"
    assert payload["messageId"] == "msg_002"
    assert payload["chatId"] == "chat_002"
    assert payload["chatName"] == "My Group"
    assert payload["authorId"] == "user_123"
    assert payload["authorName"] == "John Doe"
    assert payload["text"] == "Hello world!"
    assert payload["contentUrl"] == "https://example.com/file.pdf"
    assert payload["contentType"] == "document"
    assert payload["createdAt"] == created_at.isoformat()
    assert payload["metadata"] == {"source": "wappi", "media_type": "pdf"}


@pytest.mark.asyncio
async def test_emit_v2_partial_payload(service, outbox_repo):
    """Only non-null extra fields should appear in v2 payload."""
    await service.emit_message_collected(
        messenger="telegram",
        message_id="msg_003",
        chat_id="chat_003",
        text="Hello!",
        author_name="Bot",
    )
    kwargs = outbox_repo.add_event.call_args.kwargs
    payload = kwargs["payload"]
    assert payload["messenger"] == "telegram"
    assert payload["messageId"] == "msg_003"
    assert payload["chatId"] == "chat_003"
    assert payload["text"] == "Hello!"
    assert payload["authorName"] == "Bot"
    # chat_name, author_id, content_url, content_type, created_at, metadata should be absent
    assert "chatName" not in payload
    assert "authorId" not in payload
    assert "contentUrl" not in payload
    assert "contentType" not in payload
    assert "createdAt" not in payload
    assert "metadata" not in payload
    assert kwargs["event_version"] == 2


@pytest.mark.asyncio
async def test_emit_correlation_id_passthrough(service, outbox_repo):
    """correlation_id should be forwarded to repository."""
    await service.emit_message_collected(
        messenger="whatsapp",
        message_id="msg_004",
        chat_id="chat_004",
        correlation_id="corr_001",
    )
    kwargs = outbox_repo.add_event.call_args.kwargs
    assert kwargs["correlation_id"] == "corr_001"


@pytest.mark.asyncio
async def test_emit_v2_raw_none_excluded(service, outbox_repo):
    """Ensure None values in metadata/raw are excluded from v2 payload."""
    await service.emit_message_collected(
        messenger="whatsapp",
        message_id="msg_005",
        chat_id="chat_005",
        text="Test",
        raw=None,
    )
    kwargs = outbox_repo.add_event.call_args.kwargs
    payload = kwargs["payload"]
    assert "metadata" not in payload


@pytest.mark.asyncio
async def test_replay_dedupe_key_prefix(service, outbox_repo):
    """When replay=True, dedupe_key should have replay-v2: prefix."""
    await service.emit_message_collected(
        messenger="whatsapp",
        message_id="msg_replay",
        chat_id="chat_replay",
        replay=True,
    )
    kwargs = outbox_repo.add_event.call_args.kwargs
    assert kwargs["dedupe_key"] == "replay-v2:im.message_collected:whatsapp:chat_replay:msg_replay"


@pytest.mark.asyncio
async def test_replay_default_key_unchanged(service, outbox_repo):
    """When replay=False (default), dedupe_key should remain unchanged with im.message_collected: prefix."""
    await service.emit_message_collected(
        messenger="whatsapp",
        message_id="msg_normal",
        chat_id="chat_normal",
    )
    kwargs = outbox_repo.add_event.call_args.kwargs
    assert kwargs["dedupe_key"] == "im.message_collected:whatsapp:chat_normal:msg_normal"

    # Also verify explicit replay=False
    outbox_repo.reset_mock()
    await service.emit_message_collected(
        messenger="telegram",
        message_id="msg_normal_2",
        chat_id="chat_normal_2",
        replay=False,
    )
    kwargs = outbox_repo.add_event.call_args.kwargs
    assert kwargs["dedupe_key"] == "im.message_collected:telegram:chat_normal_2:msg_normal_2"
