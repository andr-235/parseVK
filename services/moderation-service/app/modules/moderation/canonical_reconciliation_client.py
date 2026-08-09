from __future__ import annotations

from typing import Any

import httpx
from common.events import ContentCanonicalCommentV1

RECONCILIATION_PATH = "/internal/content/comments/reconciliation"


class CanonicalReconciliationError(RuntimeError):
    pass


class CanonicalContentClient:
    def __init__(
        self,
        *,
        base_url: str,
        internal_token: str,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._internal_token = internal_token
        self._client = http_client

    async def fetch_page(
        self,
        *,
        after_id: int | None,
        limit: int,
    ) -> dict[str, Any]:
        headers = {"X-Internal-Service-Token": self._internal_token}
        params: dict[str, int] = {"limit": limit}
        if after_id is not None:
            params["after_id"] = after_id
        if self._client is not None:
            response = await self._client.get(
                f"{self._base_url}{RECONCILIATION_PATH}",
                headers=headers,
                params=params,
            )
        else:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self._base_url}{RECONCILIATION_PATH}",
                    headers=headers,
                    params=params,
                )
        response.raise_for_status()
        body = response.json()
        if not isinstance(body, dict) or not isinstance(body.get("items"), list):
            raise CanonicalReconciliationError("invalid content reconciliation response")
        return body


def canonical_comment_from_api(
    row: Any,
) -> tuple[ContentCanonicalCommentV1, int]:
    if not isinstance(row, dict):
        raise CanonicalReconciliationError("canonical content row must be an object")
    try:
        post_revision = int(row["postRevision"])
        if post_revision <= 0:
            raise ValueError("postRevision must be positive")
        comment = ContentCanonicalCommentV1.model_validate(
            {
                "ownerId": row["vkOwnerId"],
                "postId": row["vkPostId"],
                "commentId": row["vkCommentId"],
                "authorId": row.get("authorVkId"),
                "text": row.get("text"),
                "createdAt": row.get("date"),
            }
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise CanonicalReconciliationError("invalid canonical content row") from exc

    expected_content_key = f"{comment.ownerId}:{comment.postId}:{comment.commentId}"
    expected_post_key = f"{comment.ownerId}:{comment.postId}"
    if row.get("externalKey") != expected_content_key:
        raise CanonicalReconciliationError("canonical comment externalKey mismatch")
    if row.get("postExternalKey") != expected_post_key:
        raise CanonicalReconciliationError("canonical comment postExternalKey mismatch")
    return comment, post_revision
