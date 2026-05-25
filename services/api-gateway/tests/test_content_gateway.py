import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.content.router import get_content_gateway_service
from app.modules.content.service import ContentGatewayService


class FakeContentGatewayService:
    def __init__(self):
        self.calls = []

    async def forward(self, request, method, path, *, params=None):
        self.calls.append(
            {
                "method": method,
                "path": path,
                "params": params,
                "authorization": request.headers.get("Authorization"),
            }
        )
        return {"items": [], "total": 0, "page": 1, "limit": 20, "totalPages": 0, "hasMore": False}


@pytest.fixture
def fake_service():
    return FakeContentGatewayService()


@pytest.fixture
def app(fake_service):
    app = create_app()

    async def override_content_gateway_service():
        return fake_service

    app.dependency_overrides[get_content_gateway_service] = override_content_gateway_service
    return app


@pytest.mark.asyncio
async def test_content_gateway_forwards_posts_query(app, fake_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/content/posts?page=2",
            headers={"Authorization": "Bearer token"},
        )

    assert response.status_code == 200
    assert fake_service.calls[0]["method"] == "GET"
    assert fake_service.calls[0]["path"] == "/internal/content/posts"
    assert fake_service.calls[0]["params"] == {"page": "2"}


@pytest.mark.asyncio
async def test_content_gateway_forwards_authors_legacy_query(app, fake_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/content/authors"
            "?offset=24&limit=24&search=ada&verified=false"
            "&sortBy=fullName&sortOrder=asc",
            headers={"Authorization": "Bearer token"},
        )

    assert response.status_code == 200
    assert fake_service.calls[0]["method"] == "GET"
    assert fake_service.calls[0]["path"] == "/internal/content/authors"
    assert fake_service.calls[0]["params"] == {
        "offset": "24",
        "limit": "24",
        "search": "ada",
        "verified": "false",
        "sortBy": "fullName",
        "sortOrder": "asc",
    }


@pytest.mark.asyncio
async def test_content_gateway_forwards_groups_search(app, fake_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/content/groups/search?q=alpha&limit=10",
            headers={"Authorization": "Bearer token"},
        )

    assert response.status_code == 200
    assert fake_service.calls[0]["method"] == "GET"
    assert fake_service.calls[0]["path"] == "/internal/content/groups/search"
    assert fake_service.calls[0]["params"] == {"q": "alpha", "limit": "10"}


class FakeAuthService:
    async def validate_token(self, access_token):
        assert access_token == "token"
        return {"sub": "user-42"}


class FakeContentClient:
    def __init__(self):
        self.last_user_id = None

    async def request(
        self,
        method,
        path,
        *,
        user_id,
        request_id=None,
        correlation_id=None,
        params=None,
    ):
        self.last_user_id = user_id
        return {"ok": True}


class FakeRequest:
    headers = {"Authorization": "Bearer token"}


@pytest.mark.asyncio
async def test_service_forwards_user_id_from_access_token_claims():
    content_client = FakeContentClient()
    service = ContentGatewayService(content_client, FakeAuthService())

    response = await service.forward(FakeRequest(), "GET", "/internal/content/posts")

    assert response == {"ok": True}
    assert content_client.last_user_id == "user-42"
