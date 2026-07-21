# ruff: noqa: E402
"""Contract compatibility test between content-service and im-service /monitoring/groups endpoints.

This test loads each service app in isolation (they share the top-level ``app`` package
name, so they cannot be imported simultaneously) and compares the response shapes of the
monitoring groups endpoints. Known differences are logged as warnings and the test
passes so that the differences are documented for the gateway adapter work (B2b).
"""

import logging
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _monitoring_compatibility_helpers import _call_content_service, _call_im_service


logger = logging.getLogger(__name__)


def _shape(value) -> str:
    """Return a compact JSON-schema-like shape descriptor for a value."""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return f"list[{_shape(value[0]) if value else 'empty'}]"
    if isinstance(value, dict):
        return {k: _shape(v) for k, v in value.items()}
    return type(value).__name__


def _log_mismatch(field: str, expected, actual):
    logger.warning(
        "Contract mismatch: field %s: expected %s, got %s",
        field,
        expected,
        actual,
    )


@pytest.mark.asyncio
async def test_monitoring_groups_contract_compatibility():
    """Document response-shape differences between the two monitoring groups implementations.

    The test always passes; it logs every contract mismatch so that B2b (the gateway
    adapter) has an explicit checklist of differences to fix.
    """
    content = await _call_content_service()
    im = await _call_im_service()

    # a) GET /groups shape: content wraps in {items,total}, im returns a flat array.
    content_get = content["get"]
    im_get = im["get"]

    if isinstance(content_get, dict) and "items" in content_get and "total" in content_get:
        logger.info("content-service GET /groups returns wrapped {items,total} shape")
    else:
        _log_mismatch("GET /groups shape", "{items,total} object", _shape(content_get))

    if isinstance(im_get, list):
        logger.info("im-service GET /groups returns flat array (known difference)")
        _log_mismatch("GET /groups shape", "{items,total} object", "flat array")
    else:
        _log_mismatch("GET /groups shape", "flat array", _shape(im_get))

    # f) Field name comparison inside the first item.
    content_item = content_get["items"][0] if isinstance(content_get, dict) and content_get.get("items") else {}
    im_item = im_get[0] if isinstance(im_get, list) and im_get else {}

    content_fields = set(content_item.keys())
    im_fields = set(im_item.keys())

    for field in content_fields - im_fields:
        _log_mismatch("GET /groups field", f"present in content-service ({field})", "absent in im-service")
    for field in im_fields - content_fields:
        _log_mismatch("GET /groups field", "absent in content-service", f"present in im-service ({field})")

    if "chatId" in content_item and "chat_id" in im_item:
        _log_mismatch("GET /groups field name", "chatId (camelCase)", "chat_id (snake_case)")
    if "createdAt" in content_item and "created_at" in im_item:
        _log_mismatch("GET /groups field name", "createdAt (camelCase)", "created_at (snake_case)")
    if "updatedAt" in content_item and "updated_at" in im_item:
        _log_mismatch("GET /groups field name", "updatedAt (camelCase)", "updated_at (snake_case)")

    # e) sync parameter.
    content_sync_item = content["get_sync"].get("items", [])
    im_sync_item = im["get_sync"]
    if isinstance(content_sync_item, list):
        logger.info("content-service GET /groups?sync=true is accepted and returns items")
    if isinstance(im_sync_item, list):
        logger.info("im-service GET /groups?sync=true ignores the sync flag")
        _log_mismatch("GET /groups?sync=true", "sync accepted", "sync ignored")

    # b) POST /groups request/response shape.
    content_post = content["post"]
    im_post = im["post"]

    if isinstance(content_post, dict) and "id" in content_post:
        logger.info("content-service POST /groups returns a group object")
    if isinstance(im_post, dict) and "id" in im_post:
        logger.info("im-service POST /groups returns a group object")

    if "im_group_id" in im_post and "im_group_id" not in content_post:
        _log_mismatch(
            "POST /groups response field",
            "absent im_group_id in content-service",
            f"present im_group_id in im-service ({im_post.get('im_group_id')})",
        )

    # c) PATCH /groups partial update.
    content_patch = content["patch"]
    im_patch = im["patch"]
    if isinstance(content_patch, dict) and content_patch.get("name") == "Updated Group":
        logger.info("content-service PATCH /groups accepts partial updates")
    if isinstance(im_patch, dict) and im_patch.get("name") == "Updated":
        logger.info("im-service PATCH /groups accepts partial updates")

    # d) DELETE /groups response shape.
    content_delete = content["delete"]
    im_delete = im["delete"]
    if content_delete == {"success": True, "id": 5}:
        logger.info('content-service DELETE /groups returns {"success": true, "id": N}')
    if im_delete == {"deleted": True}:
        logger.info('im-service DELETE /groups returns {"deleted": true}')
    _log_mismatch("DELETE /groups response", '{"success": true, "id": N}', '{"deleted": true}')

    # g) Error format: both should return {"detail": "..."} for 404s.
    content_patch_404 = content["patch_404"]
    im_patch_404 = im["patch_404"]
    content_delete_404 = content["delete_404"]
    im_delete_404 = im["delete_404"]

    for label, expected_status, content_resp, im_resp in (
        ("PATCH /groups/{id} 404", 404, content_patch_404, im_patch_404),
        ("DELETE /groups/{id} 404", 404, content_delete_404, im_delete_404),
    ):
        content_status = content["status_codes"].get(label.split()[0].lower() + "_404")
        im_status = im["status_codes"].get(label.split()[0].lower() + "_404")

        if content_status != expected_status:
            _log_mismatch(f"content-service {label} status", expected_status, content_status)
        if im_status != expected_status:
            _log_mismatch(f"im-service {label} status", expected_status, im_status)

        if isinstance(content_resp, dict) and "detail" in content_resp:
            logger.info("content-service %s error body has {detail: ...}", label)
        else:
            _log_mismatch(f"content-service {label} error body", '{"detail": "..."}', content_resp)

        if isinstance(im_resp, dict) and "detail" in im_resp:
            logger.info("im-service %s error body has {detail: ...}", label)
        else:
            _log_mismatch(f"im-service {label} error body", '{"detail": "..."}', im_resp)

    # im-service 409 conflict format.
    im_post_409 = im["post_409"]
    if im["status_codes"]["post_409"] == 409:
        if isinstance(im_post_409, dict) and "detail" in im_post_409:
            logger.info("im-service POST /groups duplicate returns 409 with {detail: ...}")
    else:
        _log_mismatch("im-service POST /groups duplicate status", 409, im["status_codes"]["post_409"])

    # Summary assertions: verify the documented differences are present.
    assert isinstance(content_get, dict) and "items" in content_get and "total" in content_get
    assert isinstance(im_get, list)
    assert "chatId" in content_item
    assert "chat_id" in im_item
    assert content_delete == {"success": True, "id": 5}
    assert im_delete == {"deleted": True}
    assert isinstance(content_patch_404, dict) and "detail" in content_patch_404
    assert isinstance(im_patch_404, dict) and "detail" in im_patch_404
