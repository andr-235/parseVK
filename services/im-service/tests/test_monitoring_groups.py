from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.db.session import get_session
from httpx import ASGITransport, AsyncClient


class MockScalarResult:
    def __init__(self, data: list | None = None):
        self._data = data or []

    def all(self):
        return self._data


class MockResult:
    def __init__(self, scalar_one_or_none_return=None, rowcount: int = 0):
        self._scalar_one_or_none_return = scalar_one_or_none_return
        self.rowcount = rowcount

    def scalar_one_or_none(self):
        return self._scalar_one_or_none_return

HEADERS = {
    "X-Internal-Service-Token": "dev-internal-token",
    "X-User-ID": "user-1",
}


@pytest.fixture
def app(mock_db_session):
    from app.main import create_app
    app = create_app()
    app.dependency_overrides[get_session] = lambda: mock_db_session
    return app


@pytest.mark.asyncio
async def test_list_groups_requires_internal_token(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/internal/monitoring/groups")
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_groups_empty(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/internal/monitoring/groups",
            headers=HEADERS,
            params={"messenger": "whatsapp"},
        )
        assert resp.status_code == 200
        assert resp.json() == []


@pytest.mark.asyncio
async def test_create_group_requires_auth(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/internal/monitoring/groups",
            json={"messenger": "whatsapp", "chat_id": "chat-1", "name": "Test Group"},
        )
        assert resp.status_code == 400


@pytest.mark.asyncio
async def test_create_group_duplicate_returns_409(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/internal/monitoring/groups",
            headers=HEADERS,
            json={"messenger": "whatsapp", "chat_id": "chat-1", "name": "Test Group", "category": "work"},
        )
        assert resp.status_code == 409


@pytest.mark.asyncio
async def test_update_group_returns_404_for_missing(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.patch(
            "/internal/monitoring/groups/999",
            headers=HEADERS,
            json={"name": "Updated"},
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_group_returns_404_for_missing(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.delete(
            "/internal/monitoring/groups/999",
            headers=HEADERS,
        )
        assert resp.status_code == 404


def _make_row(im_group_id: int | None = None):
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


@pytest.mark.asyncio
async def test_create_group_with_im_group_id(app, mock_db_session):
    mock_db_session.execute.return_value = MockResult(scalar_one_or_none_return=_make_row(im_group_id=42))
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/internal/monitoring/groups",
            headers=HEADERS,
            json={"messenger": "whatsapp", "chat_id": "chat-1", "name": "Test Group", "im_group_id": 42},
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["im_group_id"] == 42


@pytest.mark.asyncio
async def test_list_groups_includes_im_group_id(app, mock_db_session):
    mock_db_session.scalars.return_value = MockScalarResult([_make_row(im_group_id=7)])
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/internal/monitoring/groups",
            headers=HEADERS,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body[0]["im_group_id"] == 7


@pytest.mark.asyncio
async def test_list_groups_filters_by_category(app, mock_db_session):
    mock_db_session.scalars.return_value = MockScalarResult([_make_row(im_group_id=7)])
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/internal/monitoring/groups",
            headers=HEADERS,
            params={"category": "work"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert len(body) == 1
        assert body[0]["category"] == "work"


@pytest.mark.asyncio
async def test_update_group_includes_im_group_id(app, mock_db_session):
    mock_db_session.execute.return_value = MockResult(scalar_one_or_none_return=_make_row(im_group_id=9))
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.patch(
            "/internal/monitoring/groups/1",
            headers=HEADERS,
            json={"name": "Updated"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["im_group_id"] == 9


@pytest.mark.asyncio
async def test_repository_list_by_messenger_filters_by_category():
    from app.modules.monitoring_groups.repository import MonitoringGroupsRepository

    session = AsyncMock()
    scalars_mock = MagicMock()
    scalars_mock.all.return_value = []
    session.scalars.return_value = scalars_mock

    repository = MonitoringGroupsRepository(session)
    rows = await repository.list_by_messenger(category="work")

    assert rows == []
    executed_statement = session.scalars.call_args[0][0]
    compiled = str(executed_statement.compile(compile_kwargs={"literal_binds": True}))
    assert "category" in compiled.lower()
