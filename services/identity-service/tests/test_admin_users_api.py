# ruff: noqa: E402
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
from app.modules.users.dependencies import get_users_service
from app.modules.users.schemas import UserListResponse


class FakeUsersService:
    async def list_users(self, query):
        return UserListResponse(
            items=[],
            page=query.page,
            pageSize=query.page_size,
            total=0,
            totalPages=0,
        )


async def fake_service():
    return FakeUsersService()


@pytest.mark.asyncio
async def test_list_users_returns_pagination_metadata():
    app = create_app()
    app.dependency_overrides[get_users_service] = fake_service
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/admin/users?page=2&pageSize=10",
            headers={"X-Internal-Service-Token": settings.internal_service_token},
        )

    assert response.status_code == 200
    assert response.json() == {
        "items": [],
        "page": 2,
        "pageSize": 10,
        "total": 0,
        "totalPages": 0,
    }


@pytest.mark.asyncio
async def test_update_last_admin_returns_conflict():
    from app.modules.users.admin_router import translate_error
    from app.modules.users.service import AdminInvariantError
    from fastapi import HTTPException

    error = translate_error(AdminInvariantError())
    assert isinstance(error, HTTPException)
    assert error.status_code == 409


@pytest.mark.parametrize(
    "payload",
    [
        {"username": "ab", "password": "long-enough-password", "role": "user"},
        {"username": "valid-user", "password": "short", "role": "user"},
        {"username": "valid-user", "password": "long-enough-password", "role": "owner"},
    ],
)
def test_create_schema_rejects_invalid_payload(payload):
    from app.modules.users.schemas import CreateUserRequest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        CreateUserRequest.model_validate(payload)
