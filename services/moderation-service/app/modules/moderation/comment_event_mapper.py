import logging
from datetime import datetime
from typing import Any

from common.events import ContentCanonicalCommentV1

logger = logging.getLogger(__name__)


class InvalidCanonicalCommentEvent(ValueError):
    pass


def map_canonical_comment_event(
    comment: ContentCanonicalCommentV1,
    matched_keywords: list[str],
) -> dict[str, Any]:
    if not matched_keywords:
        raise InvalidCanonicalCommentEvent("matched_keywords cannot be empty for persistence")
    created_at: datetime | None = None
    if comment.createdAt is not None:
        try:
            created_at = datetime.fromisoformat(comment.createdAt)
        except ValueError as exc:
            raise InvalidCanonicalCommentEvent(
                "canonical comment createdAt must be ISO 8601"
            ) from exc
    payload = {
        "external_key": f"vk_{comment.ownerId}_{comment.postId}_{comment.commentId}",
        "post_external_key": f"vk_{comment.ownerId}_{comment.postId}",
        "text": comment.text,
        "date": created_at,
        "author_vk_id": comment.authorId,
        "source": "VK",
        "matched_keywords": sorted(set(matched_keywords)),
    }
    logger.debug(
        "Mapped canonical comment: owner_id=%s post_id=%s comment_id=%s matched_count=%d",
        comment.ownerId,
        comment.postId,
        comment.commentId,
        len(payload["matched_keywords"]),
    )
    return payload
