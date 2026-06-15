import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path  # noqa: E402

use_service_path()

from app.clients.moderation.client import (  # noqa: E402
    ModerationClientHTTPError,
    ModerationClientUnavailableError,
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

    assert result["isRead"] is False
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
            raise ModerationClientHTTPError(status_code=409, detail={"detail": "conflict"})

    service = CommentsGatewayService(
        moderation_client=FailingModerationClient(),
        content_client=EmptyContentClient(),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.get_comments(page=1, limit=20)

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == {"detail": "conflict"}


@pytest.mark.asyncio
async def test_get_comments_maps_unavailable_upstream_to_503():
    class UnavailableModerationClient:
        async def request(self, method: str, path: str, **kwargs):
            raise ModerationClientUnavailableError("Moderation service is unavailable")

    service = CommentsGatewayService(
        moderation_client=UnavailableModerationClient(),
        content_client=EmptyContentClient(),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.get_comments(page=1, limit=20)

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "Moderation service unavailable"
