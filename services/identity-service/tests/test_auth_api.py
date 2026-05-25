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
from app.modules.users.schemas import UserDto


class FakeService:
    async def me(self, user_id):
        return UserDto(
            id=user_id,
            username="admin",
            role="admin",
            is_active=True,
            is_superuser=True,
        )


async def get_fake_service():
    return FakeService()


@pytest.mark.asyncio
async def test_internal_auth_requires_service_token():
    app = create_app()
    app.dependency_overrides[get_auth_service] = get_fake_service
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/auth/me",
            params={"user_id": str(__import__("uuid").uuid4())},
        )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_internal_me_accepts_service_token():
    app = create_app()
    app.dependency_overrides[get_auth_service] = get_fake_service
    user_id = str(__import__("uuid").uuid4())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/auth/me",
            params={"user_id": user_id},
            headers={"X-Internal-Service-Token": settings.internal_service_token},
        )

    assert response.status_code == 200
    assert response.json()["username"] == "admin"


@pytest.mark.asyncio
async def test_jwks_is_public():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/.well-known/jwks.json")

    assert response.status_code == 200
    assert response.json()["keys"][0]["kid"] == settings.jwt_key_id
