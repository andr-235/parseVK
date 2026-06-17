import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.listings.dependencies import get_listings_service


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeListingsService:
    def __init__(self):
        self.calls = []

    async def list_listings(self, **kwargs):
        self.calls.append(("list", kwargs))
        return {
            "items": [
                {
                    "id": 1,
                    "source": "avito",
                    "externalId": None,
                    "title": "Flat",
                    "description": None,
                    "url": "https://example.test/flat",
                    "price": 100,
                    "currency": None,
                    "address": None,
                    "city": None,
                    "latitude": None,
                    "longitude": None,
                    "rooms": None,
                    "areaTotal": None,
                    "areaLiving": None,
                    "areaKitchen": None,
                    "floor": None,
                    "floorsTotal": None,
                    "publishedAt": None,
                    "contactName": None,
                    "contactPhone": None,
                    "images": [],
                    "sourceAuthorName": None,
                    "sourceAuthorPhone": None,
                    "sourceAuthorUrl": None,
                    "sourcePostedAt": None,
                    "sourceParsedAt": None,
                    "manualOverrides": [],
                    "manualNote": None,
                    "archived": False,
                    "createdAt": "2026-05-24T00:00:00+00:00",
                    "updatedAt": "2026-05-24T00:00:00+00:00",
                }
            ],
            "total": 1,
            "page": kwargs["page"],
            "pageSize": kwargs["page_size"],
            "hasMore": False,
            "sources": ["avito"],
        }

    async def export_csv(self, **kwargs):
        self.calls.append(("export", kwargs))
        return "ID,Источник\n1,avito\n", "listings_avito.csv"

    async def update_listing(self, listing_id, payload):
        self.calls.append(("update", listing_id, payload))
        return {"id": listing_id, "url": "https://example.test/flat", "images": [], "manualOverrides": []}

    async def delete_listing(self, listing_id):
        self.calls.append(("delete", listing_id))

    async def import_listings(self, payload):
        self.calls.append(("import", payload))
        return {"processed": 1, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "errors": []}


@pytest.fixture
def service():
    return FakeListingsService()


@pytest.fixture
def app(service):
    app = create_app()

    async def service_override():
        return service

    app.dependency_overrides[get_listings_service] = service_override
    return app


def headers():
    return {"X-Internal-Service-Token": "dev-internal-token"}


@pytest.mark.anyio
async def test_listings_internal_api_lists_with_legacy_shape(app, service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/content/listings?page=2&pageSize=10&search=flat&source=avito&archived=false&sortBy=price&sortOrder=asc",
            headers=headers(),
        )

    assert response.status_code == 200
    assert response.json()["pageSize"] == 10
    assert response.json()["items"][0]["images"] == []
    assert service.calls[0] == (
        "list",
        {
            "page": 2,
            "page_size": 10,
            "search": "flat",
            "source": "avito",
            "archived": False,
            "sort_by": "price",
            "sort_order": "asc",
        },
    )


@pytest.mark.anyio
async def test_listings_export_returns_csv_headers(app, service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/content/listings/export?source=avito&fields=id,source",
            headers=headers(),
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv; charset=utf-8")
    assert "listings_avito.csv" in response.headers["content-disposition"]
    assert response.text.startswith("ID,")
    assert service.calls[0][0] == "export"


@pytest.mark.anyio
async def test_listings_crud_routes(app, service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        updated = await client.patch(
            "/internal/content/listings/7",
            headers=headers(),
            json={"title": "Updated", "archived": True},
        )
        deleted = await client.delete("/internal/content/listings/7", headers=headers())

    assert updated.status_code == 200
    assert updated.json()["id"] == 7
    assert deleted.status_code == 204
    assert service.calls[0] == ("update", 7, {"title": "Updated", "archived": True})
    assert service.calls[1] == ("delete", 7)


@pytest.mark.anyio
async def test_data_import_accepts_legacy_single_object_and_array_forms(app, service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        single = await client.post(
            "/internal/content/data/import",
            headers=headers(),
            json={"url": "https://example.test/one"},
        )
        array = await client.post(
            "/internal/content/data/import",
            headers=headers(),
            json=[{"url": "https://example.test/two"}],
        )

    assert single.status_code == 200
    assert array.status_code == 200
    assert service.calls[0] == ("import", {"listings": [{"url": "https://example.test/one"}]})
    assert service.calls[1] == ("import", {"listings": [{"url": "https://example.test/two"}]})
