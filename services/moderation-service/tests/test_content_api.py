import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.main import create_app
from app.db.models import ModerationComment
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
            date=datetime.now(timezone.utc),
            author_vk_id=98765,
            is_read=False,
            source="TASK",
            matched_keywords=["тест"]
        )

    async def get_comments(self, page: int, limit: int, read_status: str | None = None, search: str | None = None):
        return [self.comment]

    async def get_comments_cursor(self, cursor: str | None, limit: int, read_status: str | None = None, search: str | None = None):
        return {
            "items": [self.comment],
            "next_cursor": "cursor_123"
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
        # 1. Проверяем получение комментариев
        listed = await client.get("/internal/moderation/comments?page=1&limit=10", headers=headers())
        assert listed.status_code == 200
        items = listed.json()
        assert len(items) == 1
        assert items[0]["id"] == 42
        assert items[0]["is_read"] is False

        # 2. Проверяем получение с курсором
        cursor_listed = await client.get("/internal/moderation/comments/cursor?limit=10", headers=headers())
        assert cursor_listed.status_code == 200
        cursor_data = cursor_listed.json()
        assert len(cursor_data["items"]) == 1
        assert cursor_data["next_cursor"] == "cursor_123"

        # 3. Проверяем обновление статуса прочитанности
        patched = await client.patch(
            "/internal/moderation/comments/42/read", 
            json={"is_read": True}, 
            headers=headers()
        )
        assert patched.status_code == 200
        assert patched.json()["is_read"] is True
