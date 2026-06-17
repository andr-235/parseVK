import sys
from datetime import UTC, datetime
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.db.models import ModerationComment
from app.main import create_app
from app.modules.moderation.router import get_moderation_service


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeModerationService:
    def __init__(self):
        self.comment = ModerationComment(
            id=42,
            external_key="123_456_789",
            post_external_key="123_456",
            text="Тестовый комментарий",
            date=datetime.now(UTC),
            author_vk_id=98765,
            is_read=False,
            source="TASK",
            matched_keywords=["тест"]
        )

    async def get_comments(
        self,
        page: int,
        limit: int,
        read_status: str | None = None,
        search: str | None = None,
        keywords: list[str] | None = None,
        keyword_source: str | None = None,
    ):
        return {
            "items": [self.comment],
            "total": 1,
            "has_more": False,
            "read_count": 0,
            "unread_count": 1,
        }

    async def get_comments_cursor(
        self,
        cursor: str | None,
        limit: int,
        read_status: str | None = None,
        search: str | None = None,
        keywords: list[str] | None = None,
        keyword_source: str | None = None,
    ):
        return {
            "items": [self.comment],
            "next_cursor": "cursor_123",
            "has_more": False,
            "total": 1,
            "read_count": 0,
            "unread_count": 1,
        }

    async def update_read_status(self, id: int, is_read: bool) -> ModerationComment | None:
        if id == 42:
            self.comment.is_read = is_read
            return self.comment
        return None


@pytest.fixture
def app():
    app = create_app()

    async def service():
        return FakeModerationService()

    app.dependency_overrides[get_moderation_service] = service
    return app


def headers():
    return {"X-Internal-Service-Token": "dev-internal-token"}


@pytest.mark.anyio
async def test_moderation_internal_api_requires_token(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/internal/moderation/comments")

    assert response.status_code == 403


@pytest.mark.anyio
async def test_moderation_comments_pagination_and_read_status(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Получение комментариев — новый формат с stats
        listed = await client.get("/internal/moderation/comments?page=1&limit=10", headers=headers())
        assert listed.status_code == 200
        data = listed.json()
        assert "items" in data
        assert "total" in data
        assert "has_more" in data
        assert "read_count" in data
        assert "unread_count" in data
        assert len(data["items"]) == 1
        assert data["items"][0]["id"] == 42
        assert data["items"][0]["is_read"] is False
        assert data["total"] == 1
        assert data["has_more"] is False
        assert data["unread_count"] == 1

        # 2. Cursor — новый формат с stats
        cursor_listed = await client.get("/internal/moderation/comments/cursor?limit=10", headers=headers())
        assert cursor_listed.status_code == 200
        cursor_data = cursor_listed.json()
        assert len(cursor_data["items"]) == 1
        assert cursor_data["next_cursor"] == "cursor_123"
        assert "has_more" in cursor_data
        assert "total" in cursor_data
        assert "read_count" in cursor_data
        assert "unread_count" in cursor_data

        # 3. Обновление статуса прочитанности
        patched = await client.patch(
            "/internal/moderation/comments/42/read",
            json={"is_read": True},
            headers=headers(),
        )
        assert patched.status_code == 200
        assert patched.json()["is_read"] is True


@pytest.mark.anyio
async def test_moderation_comments_keywords_filter(app):
    """keywords передаётся как повторяющийся query-параметр."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/moderation/comments?keywords=тест&keywords=другой",
            headers=headers(),
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data


@pytest.mark.anyio
async def test_moderation_comments_read_status_filter(app):
    """readStatus=unread/read/all возвращает stats-поля."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for status in ["unread", "read", "all"]:
            response = await client.get(
                f"/internal/moderation/comments?readStatus={status}",
                headers=headers(),
            )
            assert response.status_code == 200
            data = response.json()
            assert "items" in data
            assert "read_count" in data
            assert "unread_count" in data


@pytest.mark.anyio
async def test_moderation_comments_search_filter(app):
    """search query parameter принимается корректно."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/moderation/comments?search=Тестовый",
            headers=headers(),
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data


@pytest.mark.anyio
async def test_moderation_cursor_has_more_semantics(app):
    """has_more в cursor-ответе — bool, не просто наличие items."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/internal/moderation/comments/cursor?limit=10",
            headers=headers(),
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["has_more"], bool)
        # next_cursor type check: must be str or None
        assert data["next_cursor"] is None or isinstance(data["next_cursor"], str)


@pytest.mark.anyio
async def test_moderation_read_status_update_not_found(app):
    """Обновление несуществующего комментария возвращает 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.patch(
            "/internal/moderation/comments/9999/read",
            json={"is_read": True},
            headers=headers(),
        )
        assert response.status_code == 404
