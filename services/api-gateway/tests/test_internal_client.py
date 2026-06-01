# ruff: noqa: E402
import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path  # noqa: E402

use_service_path()

from app.clients.internal import (
    InternalClientHTTPError,
    InternalClientUnavailableError,
    InternalServiceClient,
)  # noqa: E402


@pytest.mark.asyncio
async def test_internal_client_adds_standard_headers_and_parses_json():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["X-Internal-Service-Token"] == "test-token"
        assert request.headers["X-Caller-Service"] == "api-gateway"
        assert request.headers["X-User-ID"] == "user-1"
        assert request.headers["X-Request-ID"] == "request-1"
        assert request.headers["X-Correlation-ID"] == "correlation-1"
        assert request.url.path == "/internal/items"
        assert request.url.params["q"] == "abc"
        return httpx.Response(200, json={"ok": True})

    transport = httpx.MockTransport(handler)
    async_client = httpx.AsyncClient(transport=transport, base_url="http://content")
    client = InternalServiceClient(
        service_name="Content",
        base_url="http://content/",
        internal_token="test-token",  # noqa: S106
        client=async_client,
    )

    response = await client.request(
        "GET",
        "/internal/items",
        user_id="user-1",
        request_id="request-1",
        correlation_id="correlation-1",
        params={"q": "abc"},
    )

    assert response == {"ok": True}


@pytest.mark.asyncio
async def test_internal_client_returns_none_for_empty_response():
    transport = httpx.MockTransport(lambda request: httpx.Response(204))
    async_client = httpx.AsyncClient(transport=transport, base_url="http://tasks")
    client = InternalServiceClient(
        service_name="Tasks",
        base_url="http://tasks",
        internal_token="test-token",  # noqa: S106
        client=async_client,
    )

    response = await client.request("DELETE", "/internal/tasks/1", user_id="user-1")

    assert response is None


@pytest.mark.asyncio
async def test_internal_client_raises_http_error_with_json_detail():
    transport = httpx.MockTransport(
        lambda request: httpx.Response(409, json={"detail": "conflict"})
    )
    async_client = httpx.AsyncClient(transport=transport, base_url="http://tasks")
    client = InternalServiceClient(
        service_name="Tasks",
        base_url="http://tasks",
        internal_token="test-token",  # noqa: S106
        client=async_client,
    )

    with pytest.raises(InternalClientHTTPError) as exc_info:
        await client.request("POST", "/internal/tasks", user_id="user-1")

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == {"detail": "conflict"}
    assert str(exc_info.value) == "Tasks service returned HTTP 409"


@pytest.mark.asyncio
async def test_internal_client_raises_unavailable_error_for_request_failure():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("boom", request=request)

    async_client = httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://tasks")
    client = InternalServiceClient(
        service_name="Tasks",
        base_url="http://tasks",
        internal_token="test-token",  # noqa: S106
        client=async_client,
    )

    with pytest.raises(InternalClientUnavailableError) as exc_info:
        await client.request("GET", "/internal/tasks", user_id="user-1")

    assert str(exc_info.value) == "Tasks service is unavailable"


@pytest.mark.asyncio
async def test_internal_client_raw_request_returns_response_bytes():
    transport = httpx.MockTransport(lambda request: httpx.Response(200, content=b"xlsx-bytes"))
    async_client = httpx.AsyncClient(transport=transport, base_url="http://content")
    client = InternalServiceClient(
        service_name="Content",
        base_url="http://content",
        internal_token="test-token",  # noqa: S106
        client=async_client,
    )

    response = await client.raw_request("GET", "/internal/download", user_id="user-1")

    assert response.content == b"xlsx-bytes"
