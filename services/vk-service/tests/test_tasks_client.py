import json
import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.clients.tasks.client import TasksClient


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_start_execution_sends_internal_headers_and_payload():
    requests = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json={"status": "running"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, base_url="http://tasks") as http_client:
        client = TasksClient(base_url="http://tasks", internal_service_token="token", client=http_client)
        response = await client.start_execution(42, "run-1", request_id="req-1", correlation_id="corr-1")

    assert response == {"status": "running"}
    request = requests[0]
    assert request.url.path == "/internal/tasks/42/execution/start"
    assert request.headers["X-Internal-Service-Token"] == "token"
    assert request.headers["X-Caller-Service"] == "vk-service"
    assert request.headers["X-Request-ID"] == "req-1"
    assert request.headers["X-Correlation-ID"] == "corr-1"
    assert json.loads(request.content) == {"runId": "run-1", "worker": "vk-service"}


@pytest.mark.anyio
async def test_fail_execution_sends_sanitized_error_payload():
    requests = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json={"status": "failed"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, base_url="http://tasks") as http_client:
        client = TasksClient(base_url="http://tasks", internal_service_token="token", client=http_client)
        await client.fail_execution(42, "run-1", "VK token is not configured", 0, 1, {})

    payload = json.loads(requests[0].content)
    assert payload["error"] == "VK token is not configured"
    assert "token" not in requests[0].headers
