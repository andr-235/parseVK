"""Helpers for the monitoring groups contract compatibility test.

Both content-service and im-service use ``app`` as the top-level package name, so they
must be loaded one at a time. The helpers here manage ``sys.path`` and ``sys.modules``
to isolate each service while exercising its ``/monitoring/groups`` endpoints.
"""

import logging
import sys
from collections.abc import AsyncGenerator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

from httpx import ASGITransport, AsyncClient


logger = logging.getLogger(__name__)

CONTENT_SERVICE_ROOT = Path(__file__).resolve().parents[2] / "content-service"
IM_SERVICE_ROOT = Path(__file__).resolve().parents[2] / "im-service"

HEADERS_IM = {
    "X-Internal-Service-Token": "dev-internal-token",
    "X-User-ID": "user-1",
}


@contextmanager
def _service_context(service_root: Path):
    """Temporarily put a service root on sys.path and clear cached ``app`` modules."""
    str_root = str(service_root)

    for name in list(sys.modules):
        if name == "app" or name.startswith("app."):
            del sys.modules[name]

    if str_root in sys.path:
        sys.path.remove(str_root)
    sys.path.insert(0, str_root)

    for other in (CONTENT_SERVICE_ROOT, IM_SERVICE_ROOT):
        if other != service_root:
            other_str = str(other)
            if other_str in sys.path:
                sys.path.remove(other_str)

    try:
        yield
    finally:
        if str_root in sys.path:
            sys.path.remove(str_root)
        # Drop cached app modules again so the next test reloads the right app package.
        for name in list(sys.modules):
            if name == "app" or name.startswith("app."):
                del sys.modules[name]


class _FakeContentMonitoringService:
    """Drop-in replacement for content-service ``MonitoringService``."""

    def __init__(self, raise_404_for: tuple = ()):
        self.calls: list[tuple] = []
        self.raise_404_for = set(raise_404_for)

    async def get_groups(self, **kwargs):
        self.calls.append(("get_groups", kwargs))
        return {
            "items": [
                {
                    "id": 1,
                    "messenger": kwargs.get("messenger") or "whatsapp",
                    "chat_id": "123",
                    "name": "Group 1",
                    "category": kwargs.get("category") or "work",
                    "created_at": "2026-05-25T12:00:00Z",
                    "updated_at": "2026-05-25T12:00:00Z",
                }
            ],
            "total": 1,
        }

    async def create_group(self, dto):
        self.calls.append(("create_group", dto))
        return {
            "id": 1,
            "messenger": dto.messenger,
            "chat_id": dto.chat_id,
            "name": dto.name,
            "category": dto.category,
            "created_at": "2026-05-25T12:00:00Z",
            "updated_at": "2026-05-25T12:00:00Z",
        }

    async def update_group(self, id, dto):
        self.calls.append(("update_group", id, dto))
        if id in self.raise_404_for:
            raise ValueError(f"Group with ID {id} not found")
        return {
            "id": id,
            "messenger": dto.messenger or "whatsapp",
            "chat_id": dto.chat_id or "123",
            "name": dto.name or "Updated Group",
            "category": dto.category or "work",
            "created_at": "2026-05-25T12:00:00Z",
            "updated_at": "2026-05-25T12:00:00Z",
        }

    async def delete_group(self, id):
        self.calls.append(("delete_group", id))
        if id in self.raise_404_for:
            raise ValueError(f"Group with ID {id} not found")
        return {"success": True, "id": id}


class _MockScalarResult:
    def __init__(self, data: list | None = None):
        self._data = data or []

    def all(self):
        return self._data

    def one_or_none(self):
        return self._data[0] if self._data else None


class _MockResult:
    def __init__(self, scalar_one_or_none_return=None, rowcount: int = 0):
        self._scalar_one_or_none_return = scalar_one_or_none_return
        self.rowcount = rowcount

    def scalar_one_or_none(self):
        return self._scalar_one_or_none_return


def _make_im_group_row(im_group_id: int | None = None):
    now = datetime.now(UTC)
    return SimpleNamespace(
        id=1,
        messenger="whatsapp",
        chat_id="chat-1",
        name="Test Group",
        category="work",
        im_group_id=im_group_id,
        created_at=now,
        updated_at=now,
    )


def _make_mock_db_session():
    """Build a fresh mock AsyncSession for im-service tests."""
    session = AsyncMock()
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=None)

    row = _make_im_group_row(im_group_id=42)
    session.scalars.return_value = _MockScalarResult([row])
    session.scalar.return_value = None
    session.execute.return_value = _MockResult(
        scalar_one_or_none_return=row,
        rowcount=1,
    )
    return session


async def _call_content_service() -> dict:
    """Load content-service app, exercise /monitoring/groups, and return responses."""
    with _service_context(CONTENT_SERVICE_ROOT):
        from app.main import create_app
        from app.modules.monitoring.dependencies import get_monitoring_service

        app = create_app()
        fake_service = _FakeContentMonitoringService()

        async def override_service() -> _FakeContentMonitoringService:
            return fake_service

        app.dependency_overrides[get_monitoring_service] = override_service

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            get_resp = await client.get("/monitoring/groups?messenger=whatsapp&category=work")
            get_sync_resp = await client.get("/monitoring/groups?messenger=whatsapp&sync=true")
            post_resp = await client.post(
                "/monitoring/groups",
                json={"messenger": "max", "chatId": "456", "name": "New Group", "category": "news"},
            )
            patch_resp = await client.patch(
                "/monitoring/groups/5",
                json={"name": "Updated Group"},
            )
            delete_resp = await client.delete("/monitoring/groups/5")

            fake_service.raise_404_for.add(999)
            patch_404_resp = await client.patch(
                "/monitoring/groups/999",
                json={"name": "Ghost"},
            )
            delete_404_resp = await client.delete("/monitoring/groups/999")

    return {
        "get": get_resp.json(),
        "get_sync": get_sync_resp.json(),
        "post": post_resp.json(),
        "patch": patch_resp.json(),
        "delete": delete_resp.json(),
        "patch_404": patch_404_resp.json(),
        "delete_404": delete_404_resp.json(),
        "status_codes": {
            "get": get_resp.status_code,
            "get_sync": get_sync_resp.status_code,
            "post": post_resp.status_code,
            "patch": patch_resp.status_code,
            "delete": delete_resp.status_code,
            "patch_404": patch_404_resp.status_code,
            "delete_404": delete_404_resp.status_code,
        },
    }


async def _call_im_service() -> dict:
    """Load im-service app, exercise /internal/monitoring/groups, and return responses."""
    with _service_context(IM_SERVICE_ROOT):
        from app.db.session import get_session
        from app.main import create_app

        app = create_app()
        mock_session = _make_mock_db_session()

        async def override_session() -> AsyncGenerator[AsyncMock, None]:
            yield mock_session

        app.dependency_overrides[get_session] = override_session

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            get_resp = await client.get(
                "/internal/monitoring/groups",
                headers=HEADERS_IM,
                params={"messenger": "whatsapp", "category": "work"},
            )
            get_sync_resp = await client.get(
                "/internal/monitoring/groups",
                headers=HEADERS_IM,
                params={"messenger": "whatsapp", "sync": "true"},
            )
            post_resp = await client.post(
                "/internal/monitoring/groups",
                headers=HEADERS_IM,
                json={
                    "messenger": "whatsapp",
                    "chat_id": "chat-1",
                    "name": "Test Group",
                    "category": "work",
                    "im_group_id": 42,
                },
            )
            patch_resp = await client.patch(
                "/internal/monitoring/groups/1",
                headers=HEADERS_IM,
                json={"name": "Updated"},
            )
            delete_resp = await client.delete(
                "/internal/monitoring/groups/1",
                headers=HEADERS_IM,
            )

            mock_session.scalars.return_value = _MockScalarResult([])
            mock_session.execute.return_value = _MockResult(
                scalar_one_or_none_return=None,
                rowcount=0,
            )
            patch_404_resp = await client.patch(
                "/internal/monitoring/groups/999",
                headers=HEADERS_IM,
                json={"name": "Ghost"},
            )
            delete_404_resp = await client.delete(
                "/internal/monitoring/groups/999",
                headers=HEADERS_IM,
            )

            mock_session.execute.return_value = _MockResult(
                scalar_one_or_none_return=None,
                rowcount=0,
            )
            post_409_resp = await client.post(
                "/internal/monitoring/groups",
                headers=HEADERS_IM,
                json={
                    "messenger": "whatsapp",
                    "chat_id": "chat-1",
                    "name": "Test Group",
                    "category": "work",
                },
            )

    return {
        "get": get_resp.json(),
        "get_sync": get_sync_resp.json(),
        "post": post_resp.json(),
        "patch": patch_resp.json(),
        "delete": delete_resp.json(),
        "patch_404": patch_404_resp.json(),
        "delete_404": delete_404_resp.json(),
        "post_409": post_409_resp.json(),
        "status_codes": {
            "get": get_resp.status_code,
            "get_sync": get_sync_resp.status_code,
            "post": post_resp.status_code,
            "patch": patch_resp.status_code,
            "delete": delete_resp.status_code,
            "patch_404": patch_404_resp.status_code,
            "delete_404": delete_404_resp.status_code,
            "post_409": post_409_resp.status_code,
        },
    }
