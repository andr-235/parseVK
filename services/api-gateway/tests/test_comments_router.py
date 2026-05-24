import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.comments.router import router as comments_router
from app.modules.comments.service import CommentsGatewayService, get_comments_gateway_service


class FakeCommentsGatewayService:
    async def get_comments(self, params: dict):
        return [{"id": 1, "text": "test comment"}]

    async def get_comments_cursor(self, params: dict):
        return {"items": [{"id": 1, "text": "test comment"}], "next_cursor": None}

    async def patch_read_status(self, id: int, payload: dict):
        return {"id": id, "isRead": payload.get("isRead", True)}


@pytest.mark.asyncio
async def test_comments_router_imports_and_registers():
    app = create_app()
    assert app is not None
    # Verify that the router was registered correctly
    routes = [route.path for route in app.routes]
    assert "/api/v1/comments" in routes
    assert "/api/v1/comments/cursor" in routes
    assert "/api/v1/comments/{id}/read" in routes


@pytest.mark.asyncio
async def test_comments_endpoint_requires_auth():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Request without Auth header should be rejected with 401
        response = await client.get("/api/v1/comments")
    assert response.status_code == 401
