# ruff: noqa: E402
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.clients.base import ServiceClientHTTPError, ServiceClientUnavailableError
from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.modules._base import forward_service_request, translate_gateway_error


class RecordingClient:
    base_url = "http://test"
    service_name = "TestService"

    def __init__(self, response: object = None):
        self.response = response
        self.calls: list[dict] = []

    async def request(self, method: str, path: str, **kwargs):
        self.calls.append({"method": method, "path": path, **kwargs})
        return self.response


class FailingHTTPClient:
    base_url = "http://test"
    service_name = "TestService"

    def __init__(self, status_code: int, detail: object):
        self.status_code = status_code
        self.detail_value = detail

    async def request(self, method: str, path: str, **kwargs):
        raise ServiceClientHTTPError(
            service_name=self.service_name,
            status_code=self.status_code,
            detail=self.detail_value,
        )


class FailingUnavailableClient:
    base_url = "http://test"
    service_name = "TestService"

    async def request(self, method: str, path: str, **kwargs):
        raise ServiceClientUnavailableError(service_name=self.service_name)


@pytest.mark.asyncio
async def test_forward_success_returns_data():
    client = RecordingClient(response={"id": 1, "name": "test"})

    result = await forward_service_request(client, "GET", "/items/1")

    assert result == {"id": 1, "name": "test"}


@pytest.mark.asyncio
async def test_forward_passes_all_kwargs():
    client = RecordingClient(response="ok")

    result = await forward_service_request(
        client,
        "POST",
        "/items",
        user_id="user-1",
        request_id="req-1",
        correlation_id="corr-1",
        params={"page": 1},
        json={"name": "test"},
        files=None,
    )

    assert result == "ok"
    assert client.calls == [{
        "method": "POST",
        "path": "/items",
        "user_id": "user-1",
        "request_id": "req-1",
        "correlation_id": "corr-1",
        "params": {"page": 1},
        "json": {"name": "test"},
        "files": None,
    }]


@pytest.mark.asyncio
async def test_forward_http_error_raises_backend_service_error():
    client = FailingHTTPClient(status_code=404, detail={"detail": "not found"})

    with pytest.raises(BackendServiceError) as exc_info:
        await forward_service_request(client, "GET", "/items/999")

    assert exc_info.value.status_code == 404
    assert exc_info.value.service_name == "TestService"
    assert "not found" in exc_info.value.detail


@pytest.mark.asyncio
async def test_forward_http_error_with_string_detail():
    client = FailingHTTPClient(status_code=400, detail="bad request")

    with pytest.raises(BackendServiceError) as exc_info:
        await forward_service_request(client, "POST", "/items")

    assert exc_info.value.status_code == 400
    assert "bad request" in exc_info.value.detail


@pytest.mark.asyncio
async def test_forward_unavailable_raises_backend_unavailable():
    client = FailingUnavailableClient()

    with pytest.raises(BackendUnavailableError) as exc_info:
        await forward_service_request(client, "GET", "/items")

    assert exc_info.value.status_code == 502
    assert exc_info.value.service_name == "TestService"
    assert "unavailable" in exc_info.value.detail


def test_translate_backend_service_error():
    domain_error = BackendServiceError(
        service_name="Content",
        status_code=404,
        detail="Content service error: missing",
    )

    http_exc = translate_gateway_error(domain_error)

    assert isinstance(http_exc, HTTPException)
    assert http_exc.status_code == 404
    assert "missing" in http_exc.detail


def test_translate_backend_unavailable_error():
    domain_error = BackendUnavailableError(service_name="Content")

    http_exc = translate_gateway_error(domain_error)

    assert isinstance(http_exc, HTTPException)
    assert http_exc.status_code == 502
    assert "Content service error" in http_exc.detail
