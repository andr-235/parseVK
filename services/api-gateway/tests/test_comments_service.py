import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path  # noqa: E402

use_service_path()

from app.clients.base import (  # noqa: E402
    ServiceClientHTTPError,
    ServiceClientUnavailableError,
)
from app.modules.comments.service import CommentsGatewayService  # noqa: E402


class RecordingModerationClient:
    def __init__(self):
        self.calls: list[dict] = []

    async def request(self, method: str, path: str, **kwargs):
        self.calls.append({"method": method, "path": path, **kwargs})
        return {
            "id": 42,
            "external_key": "1:2:42",
            "post_external_key": None,
            "text": "comment",
            "date": None,
            "is_read": False,
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

    with pytest.raises(HTTPException) as exc_info:
        await service.patch_read_status(42, {"isRead": "false"})

    assert exc_info.value.status_code == 422
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
        {"isRead": True},
        user_id="user-1",
        request_id="req-1",
        correlation_id="corr-1",
    )

    assert result["is_read"] is False
    assert moderation_client.calls == [
        {
            "method": "PATCH",
            "path": "/internal/moderation/comments/42/read",
            "user_id": "user-1",
            "request_id": "req-1",
            "correlation_id": "corr-1",
            "params": None,
            "json": {"is_read": True},
        }
    ]


@pytest.mark.asyncio
async def test_get_comments_preserves_upstream_http_status():
    class FailingModerationClient:
        async def request(self, method: str, path: str, **kwargs):
            raise ServiceClientHTTPError(service_name="Moderation", status_code=409, detail={"detail": "conflict"})

    service = CommentsGatewayService(
        moderation_client=FailingModerationClient(),
        content_client=EmptyContentClient(),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.get_comments(page=1, limit=20)

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "conflict"


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
            self.bulk_calls.append({"method": method, "path": path, "json": kwargs.get("json")})
            if path == "/authors/bulk":
                return [
                    {"vkAuthorId": 100, "displayName": "Иван Иванов", "fullName": "Иван Иванов", "screenName": "ivanov", "profileUrl": "https://vk.com/id100"},
                    {"vkAuthorId": 101, "displayName": "Петр Петров", "fullName": "Петр Петров", "screenName": "petrov", "profileUrl": "https://vk.com/id101"},
                ]
            if path == "/groups/bulk":
                return [
                    {"vkGroupId": 213672075, "name": "Моя красивая квакадилина", "screenName": "club213672075"},
                ]
            return []

    service = CommentsGatewayService(
        moderation_client=EnrichingModerationClient(),
        content_client=EnrichingContentClient(),
    )
    result = await service.get_comments(page=1, limit=20)

    assert result["total"] == 2

    c1 = result["items"][0]
    assert c1["author"]["displayName"] == "Иван Иванов"
    assert c1["group"]["name"] == "Моя красивая квакадилина"
    assert c1["group"]["vkGroupId"] == 213672075

    c2 = result["items"][1]
    assert c2["author"]["displayName"] == "Петр Петров"
    assert c2["group"]["name"] == "Моя красивая квакадилина"
    assert c2["isRead"] is True

    assert len(service.content_client.bulk_calls) == 2  # type: ignore[attr-defined]


@pytest.mark.asyncio
async def test_get_comments_maps_unavailable_upstream_to_503():
    class UnavailableModerationClient:
        async def request(self, method: str, path: str, **kwargs):
            raise ServiceClientUnavailableError(service_name="Moderation")

    service = CommentsGatewayService(
        moderation_client=UnavailableModerationClient(),
        content_client=EmptyContentClient(),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.get_comments(page=1, limit=20)

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "Moderation service unavailable"
