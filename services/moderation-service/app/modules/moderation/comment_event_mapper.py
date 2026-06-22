import logging
from datetime import UTC, datetime
from typing import Any

logger = logging.getLogger(__name__)


class InvalidVkCommentEvent(ValueError):
    pass


def _required_int(comment: dict[str, Any], field: str) -> int:
    value = comment.get(field)
    if value is None:
        raise InvalidVkCommentEvent(f"VK comment field is required: {field}")
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise InvalidVkCommentEvent(f"VK comment field must be an integer: {field}") from exc


def _vk_timestamp(value: Any) -> datetime | None:
    if value is None:
        return None
    try:
        return datetime.fromtimestamp(int(value), UTC)
    except (TypeError, ValueError) as exc:
        raise InvalidVkCommentEvent("VK comment field must be a unix timestamp: date") from exc


def map_vk_comment_event(
    comment: dict[str, Any],
    matched_keywords: list[str],
) -> dict[str, Any]:
    if not matched_keywords:
        raise InvalidVkCommentEvent("matched_keywords cannot be empty for persistence")
    owner_id = _required_int(comment, "owner_id")
    post_id = _required_int(comment, "post_id")
    comment_id = _required_int(comment, "id")
    author_vk_id = comment.get("from_id")
    payload = {
        "external_key": f"vk_{owner_id}_{post_id}_{comment_id}",
        "post_external_key": f"vk_{owner_id}_{post_id}",
        "text": comment.get("text"),
        "date": _vk_timestamp(comment.get("date")),
        "author_vk_id": int(author_vk_id) if author_vk_id is not None else None,
        "source": "VK",
        "matched_keywords": sorted(set(matched_keywords)),
    }
    logger.debug(
        "Mapped VK comment event: owner_id=%s post_id=%s comment_id=%s matched_count=%d",
        owner_id,
        post_id,
        comment_id,
        len(payload["matched_keywords"]),
    )
    return payload
