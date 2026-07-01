from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.modules.whappi.models import WappiChat, WappiMessage


@pytest.fixture
def mock_http():
    with patch("app.modules.whappi.client.BaseApiClient") as mock:
        instance = mock.return_value
        instance.close = AsyncMock()
        yield instance


@pytest.mark.asyncio
async def test_wappi_client_list_chats(mock_http):
    from app.modules.whappi.client import WappiClient

    mock_http.paginate = AsyncMock(return_value=[
        {"id": "123", "name": "Test Chat", "group": {"Name": "Group"}},
    ])
    client = WappiClient()
    result = await client.list_chats()
    assert len(result) == 1
    assert isinstance(result[0], WappiChat)
    assert result[0].chat_id == "123"


@pytest.mark.asyncio
async def test_wappi_client_list_messages(mock_http):
    from app.modules.whappi.client import WappiClient

    mock_http.paginate = AsyncMock(return_value=[
        {"id": "msg1", "body": "hello"},
    ])
    client = WappiClient()
    result = await client.list_messages("123@g.us")
    assert len(result) == 1
    assert result[0]["body"] == "hello"
    mock_http.paginate.assert_awaited_once()


@pytest.mark.asyncio
async def test_wappi_client_get_messages_with_system(mock_http):
    from app.modules.whappi.client import WappiClient

    mock_http.paginate = AsyncMock(return_value=[
        {"id": "msg1", "body": "hello", "type": "text", "time": 1_700_000_000},
        {"id": "msg2", "body": "system event", "type": "system", "time": 1_700_000_001},
    ])
    client = WappiClient()
    result = await client.get_messages("whatsapp", "123@g.us")
    assert len(result) == 2  # include_system=True by default
    assert isinstance(result[0], WappiMessage)
    assert result[0].external_id == "msg1"
    assert result[1].external_id == "msg2"


@pytest.mark.asyncio
async def test_wappi_client_close(mock_http):
    from app.modules.whappi.client import WappiClient

    client = WappiClient()
    await client.close()
    mock_http.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_max_client_list_chats(mock_http):
    from app.modules.whappi.client import MaxApiClient

    mock_http.paginate = AsyncMock(return_value=[
        {"id": "max-1", "name": "Max Chat"},
    ])
    client = MaxApiClient()
    result = await client.list_chats()
    assert len(result) == 1
    assert isinstance(result[0], WappiChat)
    assert result[0].chat_id == "max-1"


@pytest.mark.asyncio
async def test_max_client_list_messages(mock_http):
    from app.modules.whappi.client import MaxApiClient

    mock_http.paginate = AsyncMock(return_value=[
        {"id": "mmsg1", "body": "max hello"},
    ])
    client = MaxApiClient()
    result = await client.list_messages("456")
    assert len(result) == 1
    assert result[0]["body"] == "max hello"


@pytest.mark.asyncio
async def test_max_client_get_messages(mock_http):
    from app.modules.whappi.client import MaxApiClient

    mock_http.paginate = AsyncMock(return_value=[
        {"id": "mmsg1", "body": "max text", "type": "text", "time": 1_700_000_000},
    ])
    client = MaxApiClient()
    result = await client.get_messages("whatsapp", "456")
    assert len(result) == 1
    assert isinstance(result[0], WappiMessage)


@pytest.mark.asyncio
async def test_max_client_close(mock_http):
    from app.modules.whappi.client import MaxApiClient

    client = MaxApiClient()
    await client.close()
    mock_http.close.assert_awaited_once()
