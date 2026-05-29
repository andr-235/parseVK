import sys
import time
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.content.router import get_content_service
from app.modules.content.service import ContentService


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
    def __init__(self, *, fail=False, delay_seconds=0, enrichment_budget_seconds=2.0):
        self.fail = fail
        self.delay_seconds = delay_seconds
        self.enrichment_budget_seconds = enrichment_budget_seconds
        self.calls = []

    async def summaries_by_vk_author_ids(self, vk_author_ids):
        self.calls.append(vk_author_ids)
        if self.delay_seconds:
            import anyio

            await anyio.sleep(self.delay_seconds)
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


class FakeService:
    def __init__(self, repo, photo_analysis):
        self._repo = repo
        self._photo_analysis = photo_analysis

    async def list_groups(self, page, limit, search=None, sort_by=None, sort_order="desc"):
        return await self._repo.list_groups(page, limit, search, sort_by, sort_order)

    async def search_groups(self, q, limit):
        return await self._repo.search_groups(q, limit)

    async def get_group(self, vk_group_id):
        return await self._repo.get_group(vk_group_id)

    async def list_posts(self, page, limit):
        return await self._repo.list_posts(page, limit)

    async def get_post(self, external_key):
        return await self._repo.get_post(external_key)

    async def list_comments(self, page, limit):
        return await self._repo.list_comments(page, limit)

    async def _enrich_author_summaries(self, items):
        vk_author_ids = [int(item["vkUserId"]) for item in items if item.get("vkUserId") is not None]
        if not vk_author_ids:
            return
        try:
            import asyncio
            budget = getattr(self._photo_analysis, "enrichment_budget_seconds", 2.0)
            summaries = await asyncio.wait_for(
                self._photo_analysis.summaries_by_vk_author_ids(vk_author_ids),
                timeout=budget,
            )
        except Exception:
            return
        for item in items:
            summary = summaries.get(int(item["vkUserId"]))
            if summary is not None:
                item["summary"] = summary
                item["photosCount"] = summary.get("total", item.get("photosCount"))

    async def list_authors(self, limit=20, page=None, offset=None, search=None, city=None, verified=None, sort_by=None, sort_order="desc"):
        if city is not None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Author city filter is not supported by the content projection")
        if verified not in {None, "", "all"}:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Author verified filter is not supported by the content projection")
        if sort_by and sort_by not in {"fullName", "updatedAt"}:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported author sort field: {sort_by}")
        resolved_offset = offset if offset is not None else ((page or 1) - 1) * limit
        payload = await self._repo.list_authors(
            offset=resolved_offset, limit=limit, search=search,
            city=city, verified=None if verified in {None, "", "all"} else (verified in {"true", "1"}),
            sort_by=sort_by, sort_order=sort_order if sort_order in {"asc", "desc"} else "desc",
        )
        await self._enrich_author_summaries(payload.get("items", []))
        return payload

    async def get_author(self, vk_author_id):
        row = await self._repo.get_author(vk_author_id)
        if row is not None:
            await self._enrich_author_summaries([row])
        return row

    async def list_authors_bulk(self, vk_author_ids):
        items = await self._repo.list_authors_bulk(vk_author_ids)
        await self._enrich_author_summaries(items)
        return items

    async def verify_author(self, vk_author_id):
        return await self._repo._update_author_verified_at(vk_author_id)

    async def list_posts_bulk(self, external_keys):
        return await self._repo.list_posts_bulk(external_keys)

    async def list_groups_bulk(self, vk_group_ids):
        return await self._repo.list_groups_bulk(vk_group_ids)


@pytest.fixture
def repository():
    return FakeRepository()


@pytest.fixture
def photo_analysis_client():
    return FakePhotoAnalysisClient()


@pytest.fixture
def service_instance(repository, photo_analysis_client):
    return FakeService(repository, photo_analysis_client)


@pytest.fixture
def app(service_instance):
    app = create_app()

    async def service_override():
        return service_instance

    app.dependency_overrides[get_content_service] = service_override
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
    service_instance,
):
    repo = service_instance._repo
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/content/authors?offset=0&limit=1&search=ada&sortBy=fullName&sortOrder=asc",
            headers=headers(),
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["hasMore"] is False
    assert payload["items"][0]["vkUserId"] == 101
    assert payload["items"][0]["fullName"] == "Ada Lovelace"
    assert payload["items"][0]["summary"]["total"] == 3
    assert repo.calls[0] == (
        "list_authors",
        0,
        1,
        "ada",
        None,
        None,
        "fullName",
        "asc",
    )
    assert service_instance._photo_analysis.calls == [[101]]


@pytest.mark.anyio
@pytest.mark.parametrize(
    "query",
    [
        "sortBy=photosCount",
        "city=Yakutsk",
        "verified=true",
        "verified=false",
    ],
)
async def test_authors_reject_projection_limited_query_params(app, query):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(f"/internal/content/authors?{query}", headers=headers())

    assert response.status_code == 400


@pytest.mark.anyio
async def test_authors_empty_state_keeps_legacy_shape(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/content/authors?search=missing", headers=headers())

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "hasMore": False}


@pytest.mark.anyio
async def test_authors_accept_updated_at_sort(app, service_instance):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/content/authors?sortBy=updatedAt&sortOrder=desc",
            headers=headers(),
        )

    assert response.status_code == 200
    assert service_instance._repo.calls[0] == (
        "list_authors",
        0,
        20,
        None,
        None,
        None,
        "updatedAt",
        "desc",
    )


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

    async def service_override():
        fake_pa = FakePhotoAnalysisClient(fail=True)
        return FakeService(repository, fake_pa)

    app.dependency_overrides[get_content_service] = service_override

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/content/authors?limit=1", headers=headers())

    assert response.status_code == 200
    assert response.json()["items"][0]["summary"] is None


@pytest.mark.anyio
async def test_author_photo_analysis_slow_client_uses_global_budget(repository):
    """Slow enrichment should be cancelled by per-request budget, not block the response."""
    fake_pa = FakePhotoAnalysisClient(delay_seconds=0.2, enrichment_budget_seconds=0.05)
    svc = FakeService(repository, fake_pa)

    started = time.perf_counter()
    item = svc._repo.author(1, 101, "Ada Lovelace", "2026-05-01T00:00:00+00:00")
    await svc._enrich_author_summaries([item])
    elapsed = time.perf_counter() - started

    assert elapsed < 0.15, f"Expected < 0.15s, got {elapsed:.3f}s"
    assert item.get("summary") is None


@pytest.mark.anyio
async def test_groups_list_supports_search_sort_and_pagination(app, service_instance):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/content/groups?page=1&limit=1&search=beta&sortBy=name&sortOrder=asc",
            headers=headers(),
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["vkId"] == 20
    assert service_instance._repo.calls[0] == ("list_groups", 1, 1, "beta", "name", "asc")


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
