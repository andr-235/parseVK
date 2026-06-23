# ruff: noqa: E402
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)
from _service_path import use_service_path

use_service_path()

from app.modules.admin_users.dependencies import require_admin
from app.modules.admin_users.router import list_users
from app.modules.admin_users.schemas import SortDirection, UserRole, UserSortField


class FakeService:
    def __init__(self):
        self.call = None

    async def request(self, method, path, **kwargs):
        self.call = {"method": method, "path": path, **kwargs}
        return {"items": [], "page": 1, "pageSize": 25, "total": 0, "totalPages": 0}


@pytest.mark.asyncio
async def test_non_admin_claims_are_rejected():
    with pytest.raises(HTTPException) as exc:
        await require_admin({"sub": "user-1", "roles": ["user"]})
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_list_forwards_query_and_request_context():
    service = FakeService()
    request = type(
        "Request", (), {"headers": {"X-Request-ID": "req-1", "X-Correlation-ID": "corr-1"}}
    )()
    response = await list_users(
        request=request,
        claims={"sub": "admin-1", "roles": ["admin"]},
        service=service,
        page=2,
        page_size=10,
        search="adm",
        role=UserRole.ADMIN,
        is_active=None,
        is_temporary_password=None,
        sort_by=UserSortField.CREATED_AT,
        sort_dir=SortDirection.DESC,
    )

    assert response["page"] == 1
    assert service.call["method"] == "GET"
    assert service.call["path"] == "/internal/admin/users"
    assert service.call["user_id"] == "admin-1"
    assert service.call["params"]["page"] == 2
    assert service.call["params"]["search"] == "adm"
