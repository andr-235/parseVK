# ruff: noqa: E402
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.clients.base import ServiceClientHTTPError, ServiceClientUnavailableError
from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.modules._base import forward_service_request


class RecordingIMClient:
    base_url = "http://im-service:8000"
    service_name = "IM"

    def __init__(self, response: dict):
        self.response = response
        self.calls: list[dict] = []

    async def request(self, method: str, path: str, **kwargs):
        self.calls.append({"method": method, "path": path, **kwargs})
        return self.response


@pytest.mark.asyncio
async def test_list_keywords_forwards_to_im_service():
    client = RecordingIMClient({"id": 1, "keyword": "test"})

    result = await forward_service_request(client, "GET", "/internal/keywords", params={"messenger": "whatsapp"})

    assert result == {"id": 1, "keyword": "test"}
    assert len(client.calls) == 1
    assert client.calls[0]["method"] == "GET"
    assert client.calls[0]["path"] == "/internal/keywords"
    assert client.calls[0]["params"] == {"messenger": "whatsapp"}


@pytest.mark.asyncio
async def test_add_keyword_forwards_to_im_service():
    client = RecordingIMClient({"id": 1, "keyword": "test", "messenger": "whatsapp"})

    result = await forward_service_request(
        client, "POST", "/internal/keywords",
        json={"messenger": "whatsapp", "keyword": "test"},
    )

    assert result["keyword"] == "test"
    assert client.calls[0]["method"] == "POST"
    assert client.calls[0]["path"] == "/internal/keywords"
    assert client.calls[0]["json"] == {"messenger": "whatsapp", "keyword": "test"}


@pytest.mark.asyncio
async def test_delete_keyword_forwards_to_im_service():
    client = RecordingIMClient({"deleted": True})

    await forward_service_request(client, "DELETE", "/internal/keywords/1")

    assert client.calls[0]["method"] == "DELETE"
    assert client.calls[0]["path"] == "/internal/keywords/1"


@pytest.mark.asyncio
async def test_search_messages_forwards_to_im_service():
    client = RecordingIMClient({"items": [], "count": 0})

    result = await forward_service_request(
        client, "GET", "/internal/search/messages",
        params={"messenger": "whatsapp", "q": "hello"},
    )

    assert result == {"items": [], "count": 0}
    assert client.calls[0]["params"] == {"messenger": "whatsapp", "q": "hello"}


@pytest.mark.asyncio
async def test_search_messages_post_forwards_body():
    client = RecordingIMClient({"items": [], "total": 0, "page": 1, "limit": 25})

    await forward_service_request(
        client, "POST", "/internal/search/messages/search",
        json={"messenger": "whatsapp", "only_with_keywords": True, "keywords": ["дрон", "бпла"], "page": 1, "limit": 25},
    )

    assert client.calls[0]["path"] == "/internal/search/messages/search"
    assert client.calls[0].get("json") == {"messenger": "whatsapp", "only_with_keywords": True, "keywords": ["дрон", "бпла"], "page": 1, "limit": 25}


@pytest.mark.asyncio
async def test_notifier_state_forwards_params():
    client = RecordingIMClient({"user_id": "user-1", "messenger": "whatsapp", "last_seen_message_id": 0})

    await forward_service_request(
        client, "GET", "/internal/notifier/state",
        params={"messenger": "whatsapp"},
    )

    assert client.calls[0]["path"] == "/internal/notifier/state"
    assert client.calls[0]["params"] == {"messenger": "whatsapp"}


@pytest.mark.asyncio
async def test_notifier_update_state_forwards_json():
    client = RecordingIMClient({"updated": True})

    await forward_service_request(
        client, "PUT", "/internal/notifier/state",
        json={"messenger": "whatsapp", "last_seen_message_id": 42},
    )

    assert client.calls[0]["json"]["last_seen_message_id"] == 42


@pytest.mark.asyncio
async def test_notifier_new_messages_forwards_path():
    client = RecordingIMClient({"items": [], "count": 0})

    await forward_service_request(
        client, "GET", "/internal/notifier/new-messages",
        params={"messenger": "whatsapp"},
    )

    assert client.calls[0]["path"] == "/internal/notifier/new-messages"


@pytest.mark.asyncio
async def test_list_monitoring_groups_forwards_to_im_service():
    client = RecordingIMClient({"items": [], "total": 0})

    result = await forward_service_request(
        client, "GET", "/internal/monitoring/groups",
        params={"messenger": "whatsapp"},
    )

    assert result == {"items": [], "total": 0}
    assert client.calls[0]["method"] == "GET"
    assert client.calls[0]["path"] == "/internal/monitoring/groups"
    assert client.calls[0]["params"] == {"messenger": "whatsapp"}


@pytest.mark.asyncio
async def test_create_monitoring_group_forwards_to_im_service():
    client = RecordingIMClient({"id": 1, "messenger": "whatsapp", "chat_id": "chat-1", "name": "Test"})

    result = await forward_service_request(
        client, "POST", "/internal/monitoring/groups",
        json={"messenger": "whatsapp", "chat_id": "chat-1", "name": "Test"},
    )

    assert result["name"] == "Test"
    assert client.calls[0]["method"] == "POST"
    assert client.calls[0]["path"] == "/internal/monitoring/groups"
    assert client.calls[0]["json"]["chat_id"] == "chat-1"


@pytest.mark.asyncio
async def test_update_monitoring_group_forwards_to_im_service():
    client = RecordingIMClient({"id": 1, "name": "Updated"})

    await forward_service_request(
        client, "PATCH", "/internal/monitoring/groups/5",
        json={"name": "Updated"},
    )

    assert client.calls[0]["method"] == "PATCH"
    assert client.calls[0]["path"] == "/internal/monitoring/groups/5"


@pytest.mark.asyncio
async def test_delete_monitoring_group_forwards_to_im_service():
    client = RecordingIMClient({"deleted": True})

    await forward_service_request(client, "DELETE", "/internal/monitoring/groups/5")

    assert client.calls[0]["method"] == "DELETE"
    assert client.calls[0]["path"] == "/internal/monitoring/groups/5"


@pytest.mark.asyncio
async def test_im_maps_upstream_http_error():
    class FailingClient:
        base_url = "http://im-service:8000"
        service_name = "IM"

        async def request(self, method: str, path: str, **kwargs):
            raise ServiceClientHTTPError(service_name="IM", status_code=404, detail={"detail": "not found"})

    with pytest.raises(BackendServiceError) as exc_info:
        await forward_service_request(FailingClient(), "GET", "/internal/keywords")

    assert exc_info.value.status_code == 404
    assert "IM service error" in exc_info.value.detail
    assert "not found" in exc_info.value.detail


@pytest.mark.asyncio
async def test_im_maps_unavailable_upstream_to_502():
    class UnavailableClient:
        base_url = "http://im-service:8000"
        service_name = "IM"

        async def request(self, method: str, path: str, **kwargs):
            raise ServiceClientUnavailableError(service_name="IM")

    with pytest.raises(BackendUnavailableError) as exc_info:
        await forward_service_request(UnavailableClient(), "GET", "/internal/keywords")

    assert exc_info.value.status_code == 502
    assert "IM service is unavailable" in exc_info.value.detail


class RecordingContentClient:
    base_url = "http://content-service:8000"
    service_name = "Content-Search"

    def __init__(self, response: dict):
        self.response = response
        self.calls: list[dict] = []

    async def request(self, method: str, path: str, **kwargs):
        self.calls.append({"method": method, "path": path, **kwargs})
        return self.response


@pytest.mark.asyncio
async def test_search_messages_routes_to_content_service():
    """Search GET requests should be routed to content-service (not im-service)."""
    client = RecordingContentClient({"items": [], "total": 0, "page": 1, "limit": 50})

    result = await forward_service_request(
        client, "GET", "/internal/search/messages",
        params={"messenger": "whatsapp", "q": "hello"},
    )

    assert result == {"items": [], "total": 0, "page": 1, "limit": 50}
    assert len(client.calls) == 1
    assert client.calls[0]["method"] == "GET"
    assert client.calls[0]["path"] == "/internal/search/messages"
    assert client.calls[0]["params"] == {"messenger": "whatsapp", "q": "hello"}


@pytest.mark.asyncio
async def test_search_messages_post_routes_to_content_service():
    """Search POST requests should be routed to content-service."""
    client = RecordingContentClient({"items": [], "total": 0, "page": 1, "limit": 25})

    await forward_service_request(
        client, "POST", "/internal/search/messages/search",
        json={"messenger": "whatsapp", "only_with_keywords": True, "keywords": ["test"], "page": 1, "limit": 25},
    )

    assert client.calls[0]["method"] == "POST"
    assert client.calls[0]["path"] == "/internal/search/messages/search"
    assert client.calls[0].get("json") == {
        "messenger": "whatsapp", "only_with_keywords": True, "keywords": ["test"], "page": 1, "limit": 25,
    }


@pytest.mark.asyncio
async def test_notifier_endpoints_still_use_im_service():
    """Notifier endpoints must NOT be switched to content-service — they stay on im-service."""
    client = RecordingIMClient({"user_id": "user-1", "messenger": "whatsapp", "last_seen_message_id": 0})

    await forward_service_request(
        client, "GET", "/internal/notifier/state",
        params={"messenger": "whatsapp"},
    )

    assert client.calls[0]["path"] == "/internal/notifier/state"
    assert client.calls[0]["params"] == {"messenger": "whatsapp"}


@pytest.mark.asyncio
async def test_groups_endpoints_still_use_im_service():
    """Monitoring groups endpoints must NOT be switched — they stay on im-service."""
    client = RecordingIMClient({"items": [], "total": 0})

    result = await forward_service_request(
        client, "GET", "/internal/monitoring/groups",
        params={"messenger": "whatsapp"},
    )

    assert result == {"items": [], "total": 0}
    assert client.calls[0]["method"] == "GET"
    assert client.calls[0]["path"] == "/internal/monitoring/groups"
