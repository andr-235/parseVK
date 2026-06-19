# ruff: noqa: E402, S108
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.clients.vk_service.client import VkServiceClient
from app.core.security import require_auth
from app.main import create_app
from app.modules.friends_export.models import JobStatus
from app.modules.vk_friends.adapters import VkFriendsAdapter


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_adapter_start_export():
    client_mock = AsyncMock()
    client_mock.request.return_value = {
        "jobId": "job-123",
        "status": "RUNNING"
    }

    adapter = VkFriendsAdapter(
        client=client_mock,
        user_id="user-777",
        request_id="req-111",
        correlation_id="corr-222"
    )

    res = await adapter.start_export({"user_id": 999})
    assert res.jobId == "job-123"
    assert res.status == JobStatus.RUNNING

    client_mock.request.assert_called_once_with(
        "POST",
        "/internal/vk/friends/export",
        user_id="user-777",
        request_id="req-111",
        correlation_id="corr-222",
        params=None,
        json={"params": {"user_id": 999}},
        files=None,
    )


@pytest.mark.anyio
async def test_adapter_get_job():
    client_mock = AsyncMock()
    client_mock.request.return_value = {
        "job": {
            "id": "job-123",
            "status": "DONE",
            "fetchedCount": 10,
            "totalCount": 10,
            "warning": None,
            "error": None,
            "xlsxPath": "/tmp/f.xlsx",
            "createdAt": "2026-05-08T00:00:00Z"
        },
        "logs": [
            {
                "id": "log-1",
                "level": "info",
                "message": "Step 1",
                "meta": None,
                "createdAt": "2026-05-08T00:00:00Z"
            }
        ]
    }

    adapter = VkFriendsAdapter(
        client=client_mock,
        user_id="user-777"
    )

    res = await adapter.get_job("job-123")
    assert res.job.status == JobStatus.DONE
    assert len(res.logs) == 1
    assert res.logs[0].message == "Step 1"


@pytest.mark.anyio
async def test_adapter_stream_job():
    client_mock = AsyncMock()
    
    # 1st call: RUNNING, 1 log, fetched 5
    # 2nd call: DONE, 2 logs, fetched 10
    client_mock.request.side_effect = [
        {
            "job": {
                "id": "job-123",
                "status": "RUNNING",
                "fetchedCount": 5,
                "totalCount": 10,
                "warning": None,
                "error": None,
                "xlsxPath": None,
                "createdAt": "2026-05-08T00:00:00Z"
            },
            "logs": [
                {"level": "info", "message": "Started", "meta": None}
            ]
        },
        {
            "job": {
                "id": "job-123",
                "status": "DONE",
                "fetchedCount": 10,
                "totalCount": 10,
                "warning": None,
                "error": None,
                "xlsxPath": "/tmp/test.xlsx",
                "createdAt": "2026-05-08T00:00:00Z"
            },
            "logs": [
                {"level": "info", "message": "Started", "meta": None},
                {"level": "info", "message": "Finished", "meta": None}
            ]
        }
    ]

    adapter = VkFriendsAdapter(
        client=client_mock,
        user_id="user-777"
    )

    events = []
    async for event in adapter.stream_job("job-123"):
        events.append(event)

    # Asserts
    # First iteration: progress (fetched=5), log (Started)
    # Second iteration: progress (fetched=10), log (Finished), done
    event_types = [e.type for e in events]
    assert "progress" in event_types
    assert "log" in event_types
    assert "done" in event_types

    done_event = [e for e in events if e.type == "done"][0]
    assert done_event.data.xlsxPath == "/tmp/test.xlsx"


@pytest.mark.anyio
async def test_adapter_get_xlsx_bytes_uses_vk_provider():
    client_mock = AsyncMock()
    client_mock.get_xlsx_bytes.return_value = b"xlsx"

    adapter = VkFriendsAdapter(
        client=client_mock,
        user_id="user-777",
        request_id="req-111",
        correlation_id="corr-222",
    )

    result = await adapter.get_xlsx_bytes("job-123")

    assert result == b"xlsx"
    client_mock.get_xlsx_bytes.assert_called_once_with(
        "job-123",
        provider="vk",
        user_id="user-777",
        request_id="req-111",
        correlation_id="corr-222",
    )


@pytest.mark.anyio
async def test_gateway_api_routes():
    app = create_app()

    # Mock require_auth dependency to avoid JWT validation issues
    async def mock_require_auth():
        return {"sub": "user-777"}

    app.dependency_overrides[require_auth] = mock_require_auth

    # Mock VkServiceClient response
    mock_res = {
        "jobId": "job-abc",
        "status": "RUNNING"
    }

    with patch.object(VkServiceClient, "request", AsyncMock(return_value=mock_res)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res = await ac.post("/api/v1/vk/friends/export", json={"params": {"user_id": 999}})
            assert res.status_code == 200
            data = res.json()
            assert data["jobId"] == "job-abc"
            assert data["status"] == "RUNNING"
            
    app.dependency_overrides.clear()
