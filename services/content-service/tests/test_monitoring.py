import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.monitoring.dependencies import get_monitoring_service


class FakeMonitoringService:
    def __init__(self):
        self.calls = []

    async def get_messages(self, **kwargs):
        self.calls.append(("get_messages", kwargs))
        return {
            "items": [
                {
                    "id": "1",
                    "text": "test message",
                    "createdAt": "2026-05-25T12:00:00Z",
                    "author": "author1",
                    "chat": "chat1",
                    "source": "messages",
                    "contentUrl": None,
                    "contentType": None
                }
            ],
            "total": 1,
            "usedKeywords": kwargs.get("keywords") or ["test"],
            "lastSyncAt": "2026-05-25T12:00:00Z",
            "page": kwargs.get("page", 1),
            "limit": kwargs.get("limit", 20),
            "hasMore": False,
        }


@pytest.fixture
def monitor_service():
    return FakeMonitoringService()


@pytest.fixture
def monitor_app(monitor_service):
    app = create_app()

    async def service_override():
        return monitor_service

    app.dependency_overrides[get_monitoring_service] = service_override
    return app


@pytest.mark.anyio
async def test_get_messages(monitor_app, monitor_service):
    async with AsyncClient(transport=ASGITransport(app=monitor_app), base_url="http://test") as client:
        response = await client.get("/monitoring/messages?keywords=test&limit=10&page=1")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["text"] == "test message"
    assert monitor_service.calls[0][0] == "get_messages"


@pytest.mark.anyio
async def test_get_messages_not_deprecated(monitor_app):
    async with AsyncClient(transport=ASGITransport(app=monitor_app), base_url="http://test") as client:
        response = await client.get("/monitoring/messages?keywords=test&limit=10&page=1")

    assert response.status_code == 200
    assert response.headers.get("Deprecated") is None
    assert response.headers.get("Sunset") is None
