from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path  # noqa: E402

use_service_path()

from app.core.exceptions import BackendServiceError, BackendUnavailableError  # noqa: E402
from app.modules.comments.service import CommentsGatewayService  # noqa: E402


class RecordingModerationClient:
    def __init__(self):
        self.calls: list[dict] = []

    async def request(self, method: str, path: str, **kwargs):
        self.calls.append({"method": method, "path": path, **kwargs})
        json = kwargs.get("json", {})
        return {
            "id": 42,
            "external_key": "1:2:42",
            "post_external_key": None,
            "text": "comment",
            "date": None,
            "is_read": json.get("is_read", False),
            "author_vk_id": None,
            "matched_keywords": [],
        }


class EmptyContentClient:
    async def request(self, method: str, path: str, **kwargs):
        return []


@pytest.mark.asyncio
async def test_patch_read_status_rejects_non_boolean_payload():
    moderation_client = RecordingModerationClient()
    service = CommentsGatewayService(
        moderation_client=moderation_client,
        content_client=EmptyContentClient(),
    )

    with pytest.raises(ValueError, match="is_read must be a boolean"):
        await service.patch_read_status(42, is_read="false")  # type: ignore[arg-type]

    assert moderation_client.calls == []


@pytest.mark.asyncio
async def test_patch_read_status_uses_typed_client_payload_and_context():
    moderation_client = RecordingModerationClient()
    service = CommentsGatewayService(
        moderation_client=moderation_client,
        content_client=EmptyContentClient(),
    )

    result = await service.patch_read_status(
        42,
        is_read=True,
        user_id="user-1",
        request_id="req-1",
        correlation_id="corr-1",
    )

    assert result["is_read"] is True
    assert moderation_client.calls == [
        {
            "method": "PATCH",
            "path": "/internal/moderation/comments/42/read",
            "user_id": "user-1",
            "request_id": "req-1",
            "correlation_id": "corr-1",
            "params": None,
            "json": {"is_read": True},
            "files": None,
        }
    ]


@pytest.mark.asyncio
async def test_get_comments_preserves_upstream_http_status():
    class FailingModerationClient:
        async def request(self, method: str, path: str, **kwargs):
            raise BackendServiceError(service_name="Moderation", status_code=409, detail="conflict")

    service = CommentsGatewayService(
        moderation_client=FailingModerationClient(),
        content_client=EmptyContentClient(),
    )

    with pytest.raises(BackendServiceError) as exc_info:
        await service.get_comments(page=1, limit=20)

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "Moderation service error: conflict"


@pytest.mark.asyncio
async def test_get_comments_with_enrichment():
    class EnrichingModerationClient:
        async def request(self, method: str, path: str, **kwargs):
            return {
                "items": [
                    {"id": 1, "text": "comment 1", "date": None, "is_read": False,
                     "author_vk_id": 100, "post_external_key": "vk_-213672075_500",
                     "matched_keywords": [], "external_key": "1"},
                    {"id": 2, "text": "comment 2", "date": None, "is_read": True,
                     "author_vk_id": 101, "post_external_key": "vk_-213672075_501",
                     "matched_keywords": [], "external_key": "2"},
                ],
                "total": 2, "has_more": False, "read_count": 1, "unread_count": 1,
            }

    class EnrichingContentClient:
        def __init__(self):
            self.bulk_calls = []

        async def request(self, method: str, path: str, **kwargs):
            self.bulk_calls.append({"method": "method", "path": path, "json": kwargs.get("json")})
            if path == "/internal/content/authors/bulk":
                return [
                    {"vkAuthorId": 100, "displayName": "Иван Иванов", "fullName": "Иван Иванов", "screenName": "ivanov", "photo50": None},
                    {"vkAuthorId": 101, "displayName": "Петр Петров", "fullName": "Петр Петров", "screenName": "petrov", "photo50": None},
                ]
            if path == "/internal/content/groups/bulk":
                return [
                    {"vkGroupId": 213672075, "name": "Моя красивая квакадилина", "screenName": "club213672075", "photo50": None},
                ]
            return []

    service = CommentsGatewayService(
        moderation_client=EnrichingModerationClient(),
        content_client=EnrichingContentClient(),
    )
    result = await service.get_comments(page=1, limit=20)

    assert result.total == 2

    c1 = result.items[0]
    assert c1["author"]["display_name"] == "Иван Иванов"
    assert c1["group"]["name"] == "Моя красивая квакадилина"
    assert c1["group"]["vk_group_id"] == 213672075

    c2 = result.items[1]
    assert c2["author"]["display_name"] == "Петр Петров"
    assert c2["group"]["name"] == "Моя красивая квакадилина"
    assert c2["is_read"] is True


@pytest.mark.asyncio
async def test_get_comments_maps_unavailable_upstream_to_502():
    class UnavailableModerationClient:
        async def request(self, method: str, path: str, **kwargs):
            raise BackendUnavailableError(service_name="Moderation")

    service = CommentsGatewayService(
        moderation_client=UnavailableModerationClient(),
        content_client=EmptyContentClient(),
    )

    with pytest.raises(BackendUnavailableError) as exc_info:
        await service.get_comments(page=1, limit=20)

    assert exc_info.value.service_name == "Moderation"
