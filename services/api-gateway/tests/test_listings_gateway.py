import json
import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from starlette.responses import Response

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.listings import service as listings_service_module
from app.modules.listings.router import get_listings_gateway_service
from app.modules.listings.service import ListingsGatewayService


class FakeListingsGatewayService:
    def __init__(self):
        self.calls = []

    async def list_listings(self, request):
        self.calls.append(("list", dict(request.query_params)))
        return {"items": [], "total": 0, "page": 1, "pageSize": 25, "hasMore": False, "sources": []}

    async def export_listings(self, request):
        self.calls.append(("export", dict(request.query_params)))
        return Response(
            content="ID\n",
            status_code=200,
            headers={
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": 'attachment; filename="listings.csv"',
            },
        )

    async def update_listing(self, listing_id, payload, request):
        self.calls.append(("update", listing_id, payload))
        return {"id": listing_id, "url": "https://example.test/flat"}

    async def delete_listing(self, listing_id, request):
        self.calls.append(("delete", listing_id))
        return Response(status_code=204)

    async def import_json(self, payload, request):
        self.calls.append(("import_json", payload))
        return {"processed": 1, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "errors": []}

    async def import_multipart(self, request, file, source, update_existing):
        body = json.loads((await file.read()).decode("utf-8"))
        self.calls.append(("import_multipart", body, source, update_existing))
        await file.close()
        return {"processed": 1, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "errors": []}

    async def import_multipart_request(self, request):
        form = await request.form()
        file = form.get("file")
        source = form.get("source")
        update_existing = form.get("updateExisting") == "true"
        return await self.import_multipart(request, file, source, update_existing)


@pytest.fixture
def fake_service():
    return FakeListingsGatewayService()


@pytest.fixture
def app(fake_service):
    app = create_app()

    async def override_service():
        return fake_service

    app.dependency_overrides[get_listings_gateway_service] = override_service
    return app


@pytest.mark.asyncio
async def test_listings_gateway_forwards_query_and_preserves_shape(app, fake_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/listings?page=2&pageSize=10&source=avito",
            headers={"Authorization": "Bearer token"},
        )

    assert response.status_code == 200
    assert response.json()["pageSize"] == 25
    assert fake_service.calls == [("list", {"page": "2", "pageSize": "10", "source": "avito"})]


@pytest.mark.asyncio
async def test_export_route_is_not_shadowed_by_dynamic_id_route(app, fake_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/listings/export?fields=id",
            headers={"Authorization": "Bearer token"},
        )

    assert response.status_code == 200
    assert response.text == "ID\n"
    assert response.headers["content-disposition"] == 'attachment; filename="listings.csv"'
    assert fake_service.calls == [("export", {"fields": "id"})]


@pytest.mark.asyncio
async def test_gateway_json_import_and_crud_routes(app, fake_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        imported = await client.post(
            "/api/v1/data/import",
            headers={"Authorization": "Bearer token"},
            json=[{"url": "https://example.test/flat"}],
        )
        updated = await client.patch(
            "/api/v1/listings/5",
            headers={"Authorization": "Bearer token"},
            json={"title": "Updated"},
        )
        deleted = await client.delete(
            "/api/v1/listings/5",
            headers={"Authorization": "Bearer token"},
        )

    assert imported.status_code == 200
    assert updated.json()["id"] == 5
    assert deleted.status_code == 204
    assert fake_service.calls == [
        ("import_json", [{"url": "https://example.test/flat"}]),
        ("update", 5, {"title": "Updated"}),
        ("delete", 5),
    ]


@pytest.mark.asyncio
async def test_gateway_multipart_import_success(app, fake_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/data/import",
            headers={"Authorization": "Bearer token"},
            data={"source": "avito", "updateExisting": "false"},
            files={"file": ("listings.json", b'[{"url":"https://example.test/flat"}]', "application/json")},
        )

    assert response.status_code == 200
    assert fake_service.calls == [
        ("import_multipart", [{"url": "https://example.test/flat"}], "avito", False)
    ]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("filename", "content", "content_type", "expected"),
    [
        ("empty.json", b"", "application/json", "Uploaded file is empty"),
        ("bad.txt", b"[]", "text/plain", "Only JSON files are allowed"),
        ("bad.json", b"\x80", "application/json", "File encoding must be UTF-8"),
        ("bad.json", b"{", "application/json", "Invalid JSON"),
        ("../bad.json", b"[]", "application/json", "Path traversal is not allowed"),
        ("dir/bad.json", b"[]", "application/json", "Path traversal is not allowed"),
        ("dir\\bad.json", b"[]", "application/json", "Path traversal is not allowed"),
    ],
)
async def test_gateway_multipart_import_rejects_unsafe_files(
    app,
    filename,
    content,
    content_type,
    expected,
):
    service = ListingsGatewayService(FakeContentClient(), FakeAuthService())

    async def override_service():
        return service

    app.dependency_overrides[get_listings_gateway_service] = override_service
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/data/import",
            headers={"Authorization": "Bearer token"},
            files={"file": (filename, content, content_type)},
        )

    assert response.status_code == 400
    assert response.json()["message"]
    assert expected in response.json()["errors"][0]


class FakeAuthService:
    def __init__(self, *, fail=False):
        self.fail = fail

    async def validate_token(self, access_token):
        if self.fail:
            raise ValueError("bad token")
        return {"sub": "user-42"}


class FakeContentClient:
    async def request(self, method, path, **kwargs):
        return {"ok": True, "json": kwargs.get("json")}


class ClosableFile:
    def __init__(self, *, filename="listings.json", content=b"[]", content_type="application/json"):
        self.filename = filename
        self.content = content
        self.content_type = content_type
        self.closed = False

    async def read(self):
        return self.content

    async def close(self):
        self.closed = True


class FakeRequest:
    headers = {"Authorization": "Bearer token"}


class FormRaisesRequest:
    headers = {}

    async def form(self):
        raise AssertionError("form should not be parsed before auth")


@pytest.mark.asyncio
async def test_gateway_multipart_closes_upload_on_parser_failure():
    service = ListingsGatewayService(FakeContentClient(), FakeAuthService())
    file = ClosableFile(content=b"{")

    with pytest.raises(Exception):
        await service.import_multipart(FakeRequest(), file, None, None)

    assert file.closed is True


@pytest.mark.asyncio
async def test_gateway_multipart_auth_runs_before_form_parsing():
    service = ListingsGatewayService(FakeContentClient(), FakeAuthService(fail=True))

    with pytest.raises(Exception) as exc_info:
        await service.import_multipart_request(FormRaisesRequest())

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_gateway_multipart_rejects_oversized_upload(monkeypatch):
    service = ListingsGatewayService(FakeContentClient(), FakeAuthService())
    file = ClosableFile(content=b"a" * 4)
    monkeypatch.setattr(listings_service_module.settings, "listings_import_max_bytes", 3)

    with pytest.raises(Exception) as exc_info:
        await service.import_multipart(FakeRequest(), file, None, None)

    assert "Uploaded file exceeds" in exc_info.value.detail["errors"][0]
    assert file.closed is True
