import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.modules.search.dependencies import get_search_service
from app.modules.search.repository import _build_cursor, _parse_cursor
from app.modules.search.schemas import SearchMessageItem
from app.modules.search.service import SearchService, _compute_matched_keywords, _message_to_dict


@pytest.fixture
def anyio_backend():
    return "asyncio"


def _msg(**kwargs):
    defaults = {
        "id": 1,
        "messenger": "whatsapp",
        "external_id": "msg1",
        "chat_external_id": "chat1",
        "projection_version": 1,
        "chat_name": "Chat",
        "author": "Author",
        "text": "hello world",
        "content_url": None,
        "content_type": None,
        "metadata_raw": None,
        "created_at": datetime(2026, 5, 1, 12, 0, 0, tzinfo=UTC),
        "ingested_at": datetime(2026, 5, 1, 12, 0, 0, tzinfo=UTC),
    }
    return SimpleNamespace(**{**defaults, **kwargs})


class FakeRepository:
    def __init__(self, rows=None):
        self.rows = rows or []
        self.calls = []

    async def search_messages(self, messenger, query, chat_id, author, page, limit):
        self.calls.append(("search_messages", messenger, query, chat_id, author, page, limit))
        return self.rows, len(self.rows)

    async def search_messages_dto(self, dto):
        self.calls.append(("search_messages_dto", dto))
        return self.rows, len(self.rows)

    async def search_messages_by_keywords(self, dto):
        self.calls.append(("search_messages_by_keywords", dto))
        matched, matched_kws = [], []
        for msg in self.rows:
            kws = _compute_matched_keywords(msg.text or "", dto.keywords)
            if kws:
                matched.append(msg)
                matched_kws.append(kws)
        return matched, matched_kws, False, None


@pytest.fixture
def fake_repo():
    return FakeRepository(rows=[
        _msg(id=1, text="hello world"),
        _msg(id=2, text="goodbye world", external_id="msg2"),
    ])


@pytest.fixture
def search_app(fake_repo):
    app = create_app()
    app.dependency_overrides[get_search_service] = lambda: SearchService(repository=fake_repo)
    return app


@pytest.fixture
async def client(search_app):
    async with AsyncClient(transport=ASGITransport(app=search_app), base_url="http://test") as c:
        yield c


HEADERS = {"X-Internal-Service-Token": "dev-internal-token"}


@pytest.mark.anyio
async def test_search_messages_basic(fake_repo):
    svc = SearchService(repository=fake_repo)
    result = await svc.search_messages("whatsapp", None, None, None, 1, 50)
    assert fake_repo.calls[0][0] == "search_messages"
    assert result["total"] == 2
    assert result["items"][0]["message_key"] == "whatsapp:chat1:msg1"


@pytest.mark.anyio
@pytest.mark.parametrize("messenger,query,chat_id,author", [
    ("wa", None, None, None),
    (None, "hi", None, None),
    (None, None, "chat1", None),
    (None, None, None, "Author"),
])
async def test_search_messages_with_filters(messenger, query, chat_id, author):
    repo = FakeRepository()
    svc = SearchService(repository=repo)
    await svc.search_messages(messenger, query, chat_id, author, 1, 10)
    assert repo.calls[0] == ("search_messages", messenger, query, chat_id, author, 1, 10)


@pytest.mark.anyio
async def test_search_messages_by_keywords_cursor():
    ts = datetime(2026, 5, 1, 12, 0, 0, tzinfo=UTC)
    msg = _msg(id=42, created_at=ts)
    assert _parse_cursor("2026-05-01T12:00:00+00:00_42") == (ts, 42)
    assert _parse_cursor("bad") is None
    assert _build_cursor(_msg(id=7, created_at=None)) is None
    assert _build_cursor(msg) == "2026-05-01T12:00:00+00:00_42"


@pytest.mark.anyio
async def test_message_key_and_from_attributes():
    msg = _msg()
    item = SearchMessageItem.model_validate(msg, from_attributes=True)
    assert item.message_key == "whatsapp:chat1:msg1"
    assert "message_key" in item.model_dump()
    assert _message_to_dict(msg)["message_key"] == "whatsapp:chat1:msg1"


@pytest.mark.anyio
@pytest.mark.parametrize("text,keywords,expected", [
    ("Hello World", ["hello"], ["hello"]),
    ("Hello World", ["HELLO", "foo"], ["HELLO"]),
    ("", ["hello"], []),
    ("text", [], []),
])
async def test_compute_matched_keywords(text, keywords, expected):
    assert _compute_matched_keywords(text, keywords) == expected


@pytest.mark.anyio
async def test_search_endpoint_basic(client, fake_repo):
    response = await client.get("/internal/search/messages?messenger=whatsapp&limit=10", headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["items"][0]["message_key"] == "whatsapp:chat1:msg1"
    assert fake_repo.calls[0][0] == "search_messages"


@pytest.mark.anyio
async def test_search_endpoint_post_offset(client, fake_repo):
    response = await client.post("/internal/search/messages/search", json={"query": "world", "page": 1, "limit": 10}, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["page"] == 1
    assert fake_repo.calls[0][0] == "search_messages_dto"


@pytest.mark.anyio
async def test_search_endpoint_post_keywords(client, fake_repo):
    response = await client.post("/internal/search/messages/search", json={"onlyWithKeywords": True, "keywords": ["hello"], "limit": 10}, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["totalMode"] == "not_calculated"
    assert any("hello" in item.get("matched_keywords", []) for item in data["items"])
    assert fake_repo.calls[0][0] == "search_messages_by_keywords"


@pytest.mark.anyio
async def test_search_endpoint_empty_results():
    app = create_app()
    app.dependency_overrides[get_search_service] = lambda: SearchService(repository=FakeRepository())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/search/messages?q=missing", headers=HEADERS)
    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "page": 1, "limit": 50}


@pytest.mark.anyio
async def test_internal_token_required(search_app):
    async with AsyncClient(transport=ASGITransport(app=search_app), base_url="http://test") as client:
        response = await client.get("/internal/search/messages")
    assert response.status_code == 403
