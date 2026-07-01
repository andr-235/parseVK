from __future__ import annotations

from datetime import UTC, datetime

import httpx
import pytest
import respx

from app.modules.whappi.api_client import BaseApiClient


@pytest.fixture
def api_client():
    client = BaseApiClient(
        base_url="https://wappi.test",
        api_token="test-token",
        profile_id="p1",
        page_size=10,
        request_timeout=30,
    )
    yield client


@pytest.mark.asyncio
async def test_request_json_success(api_client):
    with respx.mock:
        route = respx.get("https://wappi.test/api/test").respond(
            json={"result": "ok"}, status_code=200,
        )
        result = await api_client.request_json("GET", "/api/test", params={"q": "1"})
        assert result == {"result": "ok"}
        assert route.called


@pytest.mark.asyncio
async def test_request_json_retry_on_429(api_client):
    call_count = 0

    def side_effect(request):
        nonlocal call_count
        call_count += 1
        if call_count <= 2:
            return httpx.Response(429, json={"error": "too many"})
        return httpx.Response(200, json={"result": "ok"})

    with respx.mock:
        route = respx.get("https://wappi.test/api/test").mock(side_effect=side_effect)
        result = await api_client.request_json("GET", "/api/test")
        assert result == {"result": "ok"}
        assert call_count == 3  # initial + 2 retries


@pytest.mark.asyncio
async def test_request_json_retry_on_503():
    call_count = 0
    fast_client = BaseApiClient(
        base_url="https://wappi.test",
        api_token="test-token",
        profile_id="p1",
        max_retries=3,
    )

    def side_effect(request):
        nonlocal call_count
        call_count += 1
        return httpx.Response(503, json={"error": "unavailable"})

    with respx.mock:
        respx.get("https://wappi.test/api/test").mock(side_effect=side_effect)
        with pytest.raises(httpx.HTTPStatusError):
            await fast_client.request_json("GET", "/api/test")
        assert call_count == 3  # stop after 3 attempts


@pytest.mark.asyncio
async def test_request_json_passes_non_retryable_404(api_client):
    with respx.mock:
        route = respx.get("https://wappi.test/api/test").respond(status_code=404)
        with pytest.raises(httpx.HTTPStatusError) as exc:
            await api_client.request_json("GET", "/api/test")
        assert exc.value.response.status_code == 404
        assert route.call_count == 1  # no retry


@pytest.mark.asyncio
async def test_request_json_retry_on_timeout(api_client):
    import asyncio

    call_count = 0

    async def timeout_side_effect(request):
        nonlocal call_count
        call_count += 1
        if call_count <= 2:
            raise httpx.TimeoutException("Connection timed out", request=request)
        return httpx.Response(200, json={"result": "ok"})

    with respx.mock:
        route = respx.get("https://wappi.test/api/test").mock(side_effect=timeout_side_effect)
        result = await api_client.request_json("GET", "/api/test")
        assert result == {"result": "ok"}
        assert call_count == 3


@pytest.mark.asyncio
async def test_paginate_collects_all_pages():
    small_client = BaseApiClient(
        base_url="https://wappi.test",
        api_token="test-token",
        profile_id="p1",
        page_size=2,
    )
    pages = [
        {"items": [{"id": 1}, {"id": 2}]},
        {"items": [{"id": 3}]},
        {"items": []},
    ]
    page_iter = iter(pages)

    def side_effect(request):
        page = next(page_iter)
        return httpx.Response(200, json=page)

    with respx.mock:
        respx.get("https://wappi.test/api/items").mock(side_effect=side_effect)
        result = await small_client.paginate("/api/items", params={"filter": "all"})
        assert len(result) == 3
        assert result[0]["id"] == 1
        assert result[2]["id"] == 3


@pytest.mark.asyncio
async def test_paginate_stops_on_empty_page(api_client):
    with respx.mock:
        route = respx.get("https://wappi.test/api/items").respond(json={"items": []})
        result = await api_client.paginate("/api/items", params={})
        assert result == []
        assert route.call_count == 1


@pytest.mark.asyncio
async def test_paginate_with_total_count_limit(api_client):
    with respx.mock:
        route = respx.get("https://wappi.test/api/items").respond(
            json={"items": [{"id": 1}, {"id": 2}], "total_count": 2},
        )
        result = await api_client.paginate("/api/items", params={})
        assert len(result) == 2
        # should not make extra request because offset (2) >= total (2)
        assert route.call_count == 1


@pytest.mark.asyncio
async def test_paginate_with_callable_params(api_client):
    with respx.mock:
        respx.get("https://wappi.test/api/items").respond(json={"items": [{"id": 1}]})
        result = await api_client.paginate(
            "/api/items", params=lambda: {"profile_id": "p1"},
        )
        assert len(result) == 1


@pytest.mark.asyncio
async def test_format_message_date_uses_utc():
    ts = 1_000_000_000
    result = BaseApiClient.format_message_date(ts)
    expected = datetime.fromtimestamp(ts, tz=UTC).strftime("%Y-%m-%dT%H:%M:%S")
    assert result == expected


@pytest.mark.asyncio
async def test_normalize_chat_id():
    assert BaseApiClient.normalize_chat_id("123@g.us") == "123"
    assert BaseApiClient.normalize_chat_id("456") == "456"


@pytest.mark.asyncio
async def test_extract_items():
    data = {"messages": [{"id": 1}], "chats": [{"id": 2}]}
    result = BaseApiClient._extract_items(data)
    assert result == [{"id": 1}]  # messages comes before chats


@pytest.mark.asyncio
async def test_close_without_error(api_client):
    await api_client.close()
