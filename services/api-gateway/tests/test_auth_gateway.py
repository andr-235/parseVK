import sys
from pathlib import Path
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.clients.identity.schemas import IdentityAuthResponse, IdentityUser
from app.core.config import settings
from app.main import create_app
from app.modules.auth.router import get_auth_service


class FakeGatewayService:
    def __init__(self):
        self.logout_called = False
        self.me_called = False

    async def login(self, payload, *, request_id, correlation_id):
        return self._auth_response("access-login"), "refresh-login"

    async def refresh(self, refresh_token, *, request_id, correlation_id):
        return self._auth_response("access-refresh"), "refresh-rotated"

    async def logout(self, refresh_token, *, request_id, correlation_id):
        self.logout_called = True

    async def me(self, access_token, *, request_id, correlation_id):
        self.me_called = True
        return self._user()

    def _user(self):
        return IdentityUser(
            id=uuid4(),
            username="admin",
            role="admin",
            is_active=True,
            is_superuser=True,
        )

    def _auth_response(self, access_token):
        user = self._user()
        return (
            type(
                "GatewayAuthResponse",
                (),
                {"access_token": access_token, "user": user},
            )(),
            "unused-refresh",
        )[0]


async def get_fake_service():
    return FakeGatewayService()


@pytest.mark.asyncio
async def test_login_sets_refresh_cookie():
    app = create_app()
    app.dependency_overrides[get_auth_service] = get_fake_service

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "password"},
        )

    assert response.status_code == 200
    set_cookie = response.headers.get("set-cookie", "")
    assert settings.refresh_cookie_name in set_cookie
    assert "HttpOnly" in set_cookie
    assert "Path=/" in set_cookie
    assert "Domain=" not in set_cookie


@pytest.mark.asyncio
async def test_me_calls_identity_after_token_validation():
    app = create_app()
    service = FakeGatewayService()

    async def get_service():
        return service

    app.dependency_overrides[get_auth_service] = get_service

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer access-token"},
        )

    assert response.status_code == 200
    assert service.me_called
