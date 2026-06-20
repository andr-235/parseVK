import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.api.content.dependencies import (
    get_author_commands,
    get_author_query,
    get_group_service,
    get_post_service,
)
from app.main import create_app


class ContractContentService:
    async def save_group(self, payload):
        return {"vkId": payload["id"], "name": payload.get("name")}

    async def list_groups_bulk(self, ids):
        return [{"vkId": value} for value in ids]

    async def delete_group(self, vk_group_id):
        return vk_group_id == 10

    async def list_authors_bulk(self, ids):
        return [{"vkUserId": value} for value in ids]

    async def verify_author(self, vk_author_id):
        return vk_author_id == 101

    async def refresh_authors(self):
        return 3

    async def delete_author(self, vk_author_id):
        return vk_author_id == 101

    async def list_posts_bulk(self, keys):
        return [{"externalKey": value} for value in keys]


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def app():
    app = create_app()

    async def override():
        return ContractContentService()

    app.dependency_overrides[get_author_commands] = override
    app.dependency_overrides[get_author_query] = override
    app.dependency_overrides[get_group_service] = override
    app.dependency_overrides[get_post_service] = override
    return app


def headers():
    return {"X-Internal-Service-Token": "dev-internal-token"}


@pytest.mark.anyio
async def test_group_command_contracts(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        saved = await client.post("/internal/content/groups/save", json={"id": 10, "name": "Alpha"}, headers=headers())
        bulk = await client.post("/internal/content/groups/bulk", json=[10, 20], headers=headers())
        deleted = await client.delete("/internal/content/groups/10", headers=headers())
        missing = await client.delete("/internal/content/groups/999", headers=headers())

    assert saved.json() == {"vkId": 10, "name": "Alpha"}
    assert bulk.json() == [{"vkId": 10}, {"vkId": 20}]
    assert deleted.json() == {"deleted": True}
    assert missing.status_code == 404


@pytest.mark.anyio
async def test_author_command_contracts(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        bulk = await client.post("/internal/content/authors/bulk", json=[101, 202], headers=headers())
        verified = await client.patch("/internal/content/authors/101/verify", headers=headers())
        refreshed = await client.post("/internal/content/authors/refresh", headers=headers())
        deleted = await client.delete("/internal/content/authors/101", headers=headers())
        missing = await client.patch("/internal/content/authors/999/verify", headers=headers())

    assert bulk.json() == [{"vkUserId": 101}, {"vkUserId": 202}]
    assert verified.json() == {"status": "success"}
    assert refreshed.json() == {"updated": 3}
    assert deleted.json() == {"deleted": True}
    assert missing.status_code == 404


@pytest.mark.anyio
async def test_posts_bulk_contract_and_internal_token(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        forbidden = await client.post("/internal/content/posts/bulk", json=["-1:2"])
        response = await client.post("/internal/content/posts/bulk", json=["-1:2"], headers=headers())

    assert forbidden.status_code == 403
    assert response.json() == [{"externalKey": "-1:2"}]
