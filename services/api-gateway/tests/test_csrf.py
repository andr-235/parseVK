import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.core.config import settings
from app.main import create_app
from app.modules.auth.router import get_auth_service
from app.modules.auth.schemas import AuthResponse, AuthUser


class FakeGatewayService:
    async def refresh(self, refresh_token, *, request_id, correlation_id):
        return (
            AuthResponse(
                access_token="access-refresh",
                user=AuthUser(
                    id="00000000-0000-0000-0000-000000000001",
                    username="admin",
                    role="admin",
                    is_active=True,
                    is_superuser=True,
                ),
            ),
            "refresh-rotated",
        )

    async def logout(self, refresh_token, *, request_id, correlation_id):
        return None


async def get_fake_service():
    return FakeGatewayService()


@pytest.mark.asyncio
async def test_refresh_without_csrf_fails():
    app = create_app()
    app.dependency_overrides[get_auth_service] = get_fake_service

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/refresh",
            cookies={
                settings.refresh_cookie_name: "refresh-token",
                settings.csrf_cookie_name: "csrf-token",
            },
        )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_refresh_with_csrf_succeeds_and_rotates_cookie():
    app = create_app()
    app.dependency_overrides[get_auth_service] = get_fake_service

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/refresh",
            cookies={
                settings.refresh_cookie_name: "refresh-token",
                settings.csrf_cookie_name: "csrf-token",
            },
            headers={settings.csrf_header_name: "csrf-token"},
        )

    assert response.status_code == 200
    assert settings.refresh_cookie_name in response.headers.get("set-cookie", "")


@pytest.mark.asyncio
async def test_logout_deletes_cookie():
    app = create_app()
    app.dependency_overrides[get_auth_service] = get_fake_service

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/logout",
            cookies={
                settings.refresh_cookie_name: "refresh-token",
                settings.csrf_cookie_name: "csrf-token",
            },
            headers={settings.csrf_header_name: "csrf-token"},
        )

    assert response.status_code == 200
    assert settings.refresh_cookie_name in response.headers.get("set-cookie", "")
