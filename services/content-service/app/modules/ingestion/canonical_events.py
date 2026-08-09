from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID, uuid5

from app.modules.ingestion.canonical_helpers import flatten_comments, vk_timestamp
from app.modules.ingestion.contract import IngestionPartEnvelope

CANONICAL_COMMENTS_EVENT_TYPE = "content.canonical_comments_changed"
CANONICAL_COMMENTS_EVENT_VERSION = 1
CANONICAL_COMMENTS_CHUNK_SIZE = 250
CANONICAL_COMMENTS_NAMESPACE = UUID("c74c2c3f-c74e-4d3c-95c3-4e50f1a3900d")
MANIFEST_KEY = "canonicalModeration"


def build_canonical_moderation_manifest(
    part: IngestionPartEnvelope,
    *,
    created_at: datetime,
    post_revision: int,
) -> dict[str, Any]:
    if post_revision <= 0:
        raise ValueError("post_revision must be positive")
    owner_id = int(part.source["ownerId"])
    post_id = int(part.source["postId"])
    post_key = f"{owner_id}:{post_id}"
    normalized = [
        _normalize_comment(item)
        for item in flatten_comments(part.comments, owner_id, post_id)
    ]
    normalized.sort(
        key=lambda item: (item["ownerId"], item["postId"], item["commentId"])
    )

    chunks = [
        normalized[index : index + CANONICAL_COMMENTS_CHUNK_SIZE]
        for index in range(0, len(normalized), CANONICAL_COMMENTS_CHUNK_SIZE)
    ]
    chunk_count = len(chunks)
    events: list[dict[str, Any]] = []
    for chunk_index, comments in enumerate(chunks):
        event_id = canonical_event_id(part.source_message_id, chunk_index)
        events.append(
            {
                "eventId": str(event_id),
                "dedupeKey": f"canonical-comments:{part.source_message_id}:{chunk_index}",
                "aggregateType": "content_post",
                "aggregateId": post_key,
                "correlationId": part.event.correlation_id,
                "createdAt": created_at.isoformat(),
                "payload": {
                    "sourceService": "content-service",
                    "sourceMessageId": str(part.source_message_id),
                    "batchId": str(part.batch_id),
                    "postKey": post_key,
                    "postRevision": post_revision,
                    "chunkIndex": chunk_index,
                    "chunkCount": chunk_count,
                    "comments": comments,
                },
            }
        )
    return {
        "contractVersion": CANONICAL_COMMENTS_EVENT_VERSION,
        "events": events,
    }


def canonical_event_id(source_message_id: UUID, chunk_index: int) -> UUID:
    return uuid5(CANONICAL_COMMENTS_NAMESPACE, f"{source_message_id}:{chunk_index}")


def _normalize_comment(comment: dict[str, Any]) -> dict[str, Any]:
    created_at = vk_timestamp(comment.get("date"))
    author_id = comment.get("from_id")
    return {
        "ownerId": int(comment["owner_id"]),
        "postId": int(comment["post_id"]),
        "commentId": int(comment["id"]),
        "authorId": int(author_id) if author_id is not None else None,
        "text": comment.get("text"),
        "createdAt": created_at.isoformat() if created_at is not None else None,
    }
