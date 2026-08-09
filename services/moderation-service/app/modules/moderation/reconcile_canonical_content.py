from __future__ import annotations

import argparse
import asyncio
import json
from dataclasses import asdict, dataclass
from typing import Any

import httpx
from common.events import ContentCanonicalCommentV1
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.db.models import ModerationComment
from app.db.session import async_session_maker
from app.modules.keywords.matcher import KeywordMatcher
from app.modules.keywords.repository import KeywordMatchRepository
from app.modules.moderation.comment_event_mapper import map_canonical_comment_snapshot
from app.modules.moderation.crud_service import ModerationCrudService

RECONCILIATION_PATH = "/internal/content/comments/reconciliation"


class CanonicalReconciliationError(RuntimeError):
    pass


@dataclass
class ReconciliationStats:
    pages: int = 0
    scanned: int = 0
    matching: int = 0
    upserted: int = 0
    cleared: int = 0
    skipped_unmatched: int = 0


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


class ModerationCanonicalReconciler:
    def __init__(
        self,
        *,
        session_maker: async_sessionmaker,
        content_client: CanonicalContentClient,
    ) -> None:
        self._session_maker = session_maker
        self._content_client = content_client

    async def run(self, *, limit: int = 500) -> ReconciliationStats:
        if not 1 <= limit <= 1000:
            raise ValueError("limit must be between 1 and 1000")

        async with self._session_maker() as session:
            candidates = await KeywordMatchRepository(session).load_candidates()
        matcher = KeywordMatcher(candidates)

        stats = ReconciliationStats()
        after_id: int | None = None
        while True:
            page = await self._content_client.fetch_page(after_id=after_id, limit=limit)
            items = page["items"]
            stats.pages += 1
            if not items:
                break

            async with self._session_maker() as session:
                async with session.begin():
                    crud = ModerationCrudService(session, on_enrich=lambda records: records)
                    for row in items:
                        comment = _canonical_comment_from_api(row)
                        matched_keywords = matcher.match_text(comment.text)
                        stats.scanned += 1
                        if matched_keywords:
                            stats.matching += 1
                            await crud.upsert_comment(
                                map_canonical_comment_snapshot(comment, matched_keywords)
                            )
                            stats.upserted += 1
                            continue

                        external_key = _moderation_external_key(comment)
                        existing = await session.scalar(
                            select(ModerationComment).where(
                                ModerationComment.external_key == external_key
                            )
                        )
                        if existing is None:
                            stats.skipped_unmatched += 1
                            continue
                        await crud.upsert_comment(
                            map_canonical_comment_snapshot(comment, [])
                        )
                        stats.cleared += 1

            next_after_id = page.get("nextAfterId")
            if not isinstance(next_after_id, int):
                raise CanonicalReconciliationError(
                    "content reconciliation page did not return nextAfterId"
                )
            if after_id is not None and next_after_id <= after_id:
                raise CanonicalReconciliationError(
                    "content reconciliation cursor did not advance"
                )
            after_id = next_after_id
            if not bool(page.get("hasMore")):
                break

        return stats


def _canonical_comment_from_api(row: Any) -> ContentCanonicalCommentV1:
    if not isinstance(row, dict):
        raise CanonicalReconciliationError("canonical content row must be an object")
    try:
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
    expected_content_post_key = f"{comment.ownerId}:{comment.postId}"
    if row.get("externalKey") != expected_content_key:
        raise CanonicalReconciliationError("canonical comment externalKey mismatch")
    if row.get("postExternalKey") != expected_content_post_key:
        raise CanonicalReconciliationError("canonical comment postExternalKey mismatch")
    return comment


def _moderation_external_key(comment: ContentCanonicalCommentV1) -> str:
    return f"vk_{comment.ownerId}_{comment.postId}_{comment.commentId}"


async def _run(limit: int) -> int:
    client = CanonicalContentClient(
        base_url=settings.content_service_base_url,
        internal_token=settings.internal_service_token,
    )
    reconciler = ModerationCanonicalReconciler(
        session_maker=async_session_maker,
        content_client=client,
    )
    stats = await reconciler.run(limit=limit)
    print(json.dumps(asdict(stats), ensure_ascii=False, sort_keys=True))
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Reconcile moderation projection from canonical content API"
    )
    parser.add_argument("--limit", type=int, default=500)
    args = parser.parse_args()
    raise SystemExit(asyncio.run(_run(args.limit)))


if __name__ == "__main__":
    main()
