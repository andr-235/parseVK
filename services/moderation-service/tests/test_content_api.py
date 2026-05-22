import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.content.router import get_content_repository


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeRepository:
    async def list_posts(self, page, limit):
        return {"items": [{"externalKey": "-1:2"}], "total": 1, "page": page, "limit": limit, "totalPages": 1, "hasMore": False}

    async def get_post(self, external_key):
        return {"externalKey": external_key}

    async def list_groups(self, page, limit):
        return {"items": [], "total": 0, "page": page, "limit": limit, "totalPages": 0, "hasMore": False}

    async def get_group(self, vk_group_id):
        return {"vkGroupId": vk_group_id}

    async def list_comments(self, page, limit):
        return {"items": [], "total": 0, "page": page, "limit": limit, "totalPages": 0, "hasMore": False}

    async def list_authors(self, page, limit):
        return {"items": [], "total": 0, "page": page, "limit": limit, "totalPages": 0, "hasMore": False}

    async def get_author(self, vk_author_id):
        return {"vkAuthorId": vk_author_id}


@pytest.fixture
def app():
    app = create_app()

    async def repository():
        return FakeRepository()

    app.dependency_overrides[get_content_repository] = repository
    return app


def headers():
    return {"X-Internal-Service-Token": "dev-internal-token"}


@pytest.mark.anyio
async def test_content_internal_api_requires_token(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/content/posts")

    assert response.status_code == 403


@pytest.mark.anyio
async def test_content_posts_pagination_and_detail(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        listed = await client.get("/internal/content/posts?page=2&limit=10", headers=headers())
        detail = await client.get("/internal/content/posts/-1:2", headers=headers())

    assert listed.status_code == 200
    assert listed.json()["page"] == 2
    assert listed.json()["limit"] == 10
    assert detail.status_code == 200
    assert detail.json() == {"externalKey": "-1:2"}
