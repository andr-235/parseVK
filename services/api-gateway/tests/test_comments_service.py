import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path  # noqa: E402

use_service_path()

from app.modules.comments.service import CommentsGatewayService  # noqa: E402


class _Response:
    status_code = 200

    def raise_for_status(self):
        return None

    def json(self):
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


class RecordingAsyncClient:
    last_patch_json = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def patch(self, *args, **kwargs):
        RecordingAsyncClient.last_patch_json = kwargs.get("json")
        return _Response()


@pytest.mark.asyncio
async def test_patch_read_status_rejects_non_boolean_payload(monkeypatch):
    import app.modules.comments.service as comments_service

    monkeypatch.setattr(comments_service.httpx, "AsyncClient", RecordingAsyncClient)
    service = CommentsGatewayService()

    with pytest.raises(comments_service.HTTPException) as exc_info:
        await service.patch_read_status(42, {"isRead": "false"})

    assert exc_info.value.status_code == 422
    assert RecordingAsyncClient.last_patch_json is None
