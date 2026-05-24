import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.content.router import get_content_repository, get_photo_analysis_client


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeRepository:
    def __init__(self):
        self.calls = []
        self.authors = [
            self.author(1, 101, "Ada Lovelace", "2026-05-01T00:00:00+00:00"),
            self.author(2, 202, "Grace Hopper", "2026-05-02T00:00:00+00:00"),
        ]
        self.groups = [
            self.group(1, 10, "Alpha Group", "alpha", "2026-05-01T00:00:00+00:00"),
            self.group(2, 20, "Beta Group", "beta", "2026-05-02T00:00:00+00:00"),
        ]

    async def list_posts(self, page, limit):
        return {
            "items": [{"externalKey": "-1:2"}],
            "total": 1,
            "page": page,
            "limit": limit,
            "totalPages": 1,
            "hasMore": False,
        }

    async def get_post(self, external_key):
        return {"externalKey": external_key}

    async def list_groups(self, page, limit, search=None, sort_by=None, sort_order="desc"):
        self.calls.append(("list_groups", page, limit, search, sort_by, sort_order))
        items = [
            item
            for item in self.groups
            if not search or search.lower() in item["name"].lower()
        ]
        reverse = sort_order != "asc"
        if sort_by == "name":
            items = sorted(items, key=lambda item: item["name"], reverse=reverse)
        return {
            "items": items[(page - 1) * limit : page * limit],
            "total": len(items),
            "page": page,
            "limit": limit,
            "totalPages": 1 if items else 0,
            "hasMore": False,
        }

    async def get_group(self, vk_group_id):
        return next((item for item in self.groups if item["vkId"] == vk_group_id), None)

    async def search_groups(self, query, limit):
        self.calls.append(("search_groups", query, limit))
        items = [
            item
            for item in self.groups
            if query.lower() in item["name"].lower()
        ][:limit]
        return {"items": items, "total": len(items), "query": query}

    async def list_comments(self, page, limit):
        return {
            "items": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "totalPages": 0,
            "hasMore": False,
        }

    async def list_authors(
        self,
        offset=0,
        limit=20,
        search=None,
        city=None,
        verified=None,
        sort_by=None,
        sort_order="desc",
    ):
        self.calls.append(
            ("list_authors", offset, limit, search, city, verified, sort_by, sort_order)
        )
        items = [
            item
            for item in self.authors
            if not search or search.lower() in item["displayName"].lower()
        ]
        reverse = sort_order != "asc"
        if sort_by == "fullName":
            items = sorted(items, key=lambda item: item["displayName"], reverse=reverse)
        if verified is True or city:
            items = []
        return {
            "items": items[offset : offset + limit],
            "total": len(items),
            "hasMore": offset + limit < len(items),
        }

    async def get_author(self, vk_author_id):
        return next((item for item in self.authors if item["vkAuthorId"] == vk_author_id), None)

    def author(self, id, vk_author_id, full_name, updated_at):
        first_name, *last_name = full_name.split()
        return {
            "id": id,
            "vkAuthorId": vk_author_id,
            "vkUserId": vk_author_id,
            "type": "user",
            "displayName": full_name,
            "firstName": first_name,
            "lastName": " ".join(last_name),
            "fullName": full_name,
            "photo50": None,
            "photo100": None,
            "photo200": None,
            "domain": None,
            "screenName": None,
            "profileUrl": f"https://vk.com/id{vk_author_id}",
            "city": None,
            "country": None,
            "summary": None,
            "photosCount": None,
            "audiosCount": None,
            "videosCount": None,
            "friendsCount": None,
            "followersCount": None,
            "lastSeenAt": None,
            "verifiedAt": None,
            "isVerified": False,
            "createdAt": updated_at,
            "updatedAt": updated_at,
        }

    def group(self, id, vk_id, name, screen_name, updated_at):
        return {
            "id": id,
            "vkId": vk_id,
            "name": name,
            "screenName": screen_name,
            "updatedAt": updated_at,
        }


class FakePhotoAnalysisClient:
    def __init__(self, *, fail=False):
        self.fail = fail
        self.calls = []

    async def summaries_by_vk_author_ids(self, vk_author_ids):
        self.calls.append(vk_author_ids)
        if self.fail:
            raise RuntimeError("analysis unavailable")
        return {
            101: {
                "total": 3,
                "suspicious": 1,
                "lastAnalyzedAt": "2026-05-03T00:00:00+00:00",
                "categories": [],
                "levels": [],
            }
        }


@pytest.fixture
def repository():
    return FakeRepository()


@pytest.fixture
def photo_analysis_client():
    return FakePhotoAnalysisClient()


@pytest.fixture
def app(repository, photo_analysis_client):
    app = create_app()

    async def repository_override():
        return repository

    async def photo_analysis_client_override():
        return photo_analysis_client

    app.dependency_overrides[get_content_repository] = repository_override
    app.dependency_overrides[get_photo_analysis_client] = photo_analysis_client_override
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


@pytest.mark.anyio
async def test_authors_list_supports_legacy_filters_sort_and_offset_pagination(
    app,
    repository,
    photo_analysis_client,
):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/content/authors?offset=0&limit=1&search=ada&sortBy=fullName&sortOrder=asc&verified=false",
            headers=headers(),
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["hasMore"] is False
    assert payload["items"][0]["vkUserId"] == 101
    assert payload["items"][0]["fullName"] == "Ada Lovelace"
    assert payload["items"][0]["summary"]["total"] == 3
    assert repository.calls[0] == (
        "list_authors",
        0,
        1,
        "ada",
        None,
        False,
        "fullName",
        "asc",
    )
    assert photo_analysis_client.calls == [[101]]


@pytest.mark.anyio
async def test_authors_empty_state_keeps_legacy_shape(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/content/authors?search=missing", headers=headers())

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "hasMore": False}


@pytest.mark.anyio
async def test_author_detail_success_and_not_found(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        found = await client.get("/internal/content/authors/101", headers=headers())
        missing = await client.get("/internal/content/authors/999", headers=headers())

    assert found.status_code == 200
    assert found.json()["vkUserId"] == 101
    assert found.json()["summary"]["total"] == 3
    assert missing.status_code == 404


@pytest.mark.anyio
async def test_author_photo_analysis_failure_does_not_fail_response(repository):
    app = create_app()

    async def repository_override():
        return repository

    async def photo_analysis_client_override():
        return FakePhotoAnalysisClient(fail=True)

    app.dependency_overrides[get_content_repository] = repository_override
    app.dependency_overrides[get_photo_analysis_client] = photo_analysis_client_override

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/content/authors?limit=1", headers=headers())

    assert response.status_code == 200
    assert response.json()["items"][0]["summary"] is None


@pytest.mark.anyio
async def test_groups_list_supports_search_sort_and_pagination(app, repository):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/content/groups?page=1&limit=1&search=beta&sortBy=name&sortOrder=asc",
            headers=headers(),
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["vkId"] == 20
    assert repository.calls[0] == ("list_groups", 1, 1, "beta", "name", "asc")


@pytest.mark.anyio
async def test_groups_empty_search_and_detail_not_found(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        listed = await client.get("/internal/content/groups?search=missing", headers=headers())
        searched = await client.get("/internal/content/groups/search?q=alpha", headers=headers())
        missing = await client.get("/internal/content/groups/999", headers=headers())

    assert listed.status_code == 200
    assert listed.json()["items"] == []
    assert searched.status_code == 200
    assert searched.json()["items"][0]["vkId"] == 10
    assert missing.status_code == 404
