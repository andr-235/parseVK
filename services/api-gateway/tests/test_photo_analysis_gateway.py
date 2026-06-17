import sys
from pathlib import Path
<<<<<<< HEAD
from unittest.mock import AsyncMock, patch
=======
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path  # noqa: E402

use_service_path()

import app.core.security as _security  # noqa: E402
from app.main import create_app  # noqa: E402
from app.modules.photo_analysis.router import get_photo_analysis_gateway_service  # noqa: E402
from test_jwt_validation import make_token  # noqa: E402


@pytest.fixture(autouse=True)
def inject_jwks_cache(request):
    old_cache = _security._jwks_cache
    token, jwks = make_token()
    _security._jwks_cache = jwks
    request.node._test_token = token
    yield
    _security._jwks_cache = old_cache


def _token(request) -> str:
    return request.node._test_token


class FakePhotoAnalysisGatewayService:
    def __init__(self):
        self.calls = []

    async def forward(self, request, method, path, *, json=None, params=None):
        self.calls.append({
            "method": method,
            "path": path,
            "json": json,
            "params": params,
        })
        return {
            "items": [],
            "total": 0,
            "suspiciousCount": 0,
            "analyzedCount": 0,
            "summary": None,
        }


@pytest.fixture
def fake_service():
    return FakePhotoAnalysisGatewayService()


@pytest.fixture
def app(fake_service):
    app = create_app()

    async def override_gateway_service():
        return fake_service

    app.dependency_overrides[get_photo_analysis_gateway_service] = override_gateway_service
    return app


@pytest.mark.asyncio
async def test_photo_analysis_gateway_unauthorized_missing_token(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # No Authorization header
        response = await client.get("/api/v1/photo-analysis/vk/999")

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing or invalid credentials"


@pytest.mark.asyncio
async def test_photo_analysis_gateway_unauthorized_invalid_token(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Malformed Authorization header
        response = await client.get(
            "/api/v1/photo-analysis/vk/999",
            headers={"Authorization": "Bearer invalid-token-sig"},
        )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid access token"


@pytest.mark.asyncio
async def test_photo_analysis_gateway_authorized_happy_path(app, fake_service, request):
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {_token(request)}"},
    ) as client:
        response = await client.get("/api/v1/photo-analysis/vk/999")

    assert response.status_code == 200
    assert len(fake_service.calls) == 1
    assert fake_service.calls[0]["method"] == "GET"
    assert fake_service.calls[0]["path"] == "/internal/photo-analysis/vk/999"
