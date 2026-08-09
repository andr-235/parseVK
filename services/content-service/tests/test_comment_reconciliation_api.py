import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.core.security import require_internal_token
from app.modules.content.dependencies import get_content_service
from app.modules.content.posts_router import router


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeContentService:
    def __init__(self):
        self.calls = []

    async def list_comments_reconciliation(self, after_id, limit):
        self.calls.append((after_id, limit))
        return {
            "items": [{"id": 11, "externalKey": "vk_-1_2_3"}],
            "nextAfterId": 11,
            "hasMore": False,
        }


@pytest.mark.anyio
async def test_reconciliation_endpoint_uses_stable_cursor_parameters():
    service = FakeContentService()
    app = FastAPI()
    app.include_router(router, prefix="/internal/content")
    app.dependency_overrides[require_internal_token] = lambda: None
    app.dependency_overrides[get_content_service] = lambda: service

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.get(
            "/internal/content/comments/reconciliation",
            params={"after_id": 10, "limit": 500},
        )

    assert response.status_code == 200
    assert response.json()["nextAfterId"] == 11
    assert service.calls == [(10, 500)]


@pytest.mark.anyio
async def test_reconciliation_endpoint_rejects_oversized_batch():
    service = FakeContentService()
    app = FastAPI()
    app.include_router(router, prefix="/internal/content")
    app.dependency_overrides[require_internal_token] = lambda: None
    app.dependency_overrides[get_content_service] = lambda: service

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.get(
            "/internal/content/comments/reconciliation",
            params={"limit": 1001},
        )

    assert response.status_code == 422
    assert service.calls == []
