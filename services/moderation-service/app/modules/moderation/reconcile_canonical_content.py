from __future__ import annotations

import argparse
import asyncio
import json
from dataclasses import asdict, dataclass

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.db.session import async_session_maker
from app.modules.keywords.matcher import KeywordMatcher
from app.modules.keywords.repository import KeywordMatchRepository
from app.modules.moderation.canonical_reconciliation_client import (
    CanonicalContentClient,
    CanonicalReconciliationError,
)
from app.modules.moderation.canonical_reconciliation_client import (
    canonical_comment_from_api as _canonical_comment_from_api,
)
from app.modules.moderation.comment_event_mapper import map_canonical_comment_snapshot
from app.modules.moderation.crud_service import ModerationCrudService


@dataclass
class ReconciliationStats:
    pages: int = 0
    scanned: int = 0
    matching: int = 0
    applied: int = 0
    stale: int = 0


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
                        comment, post_revision = _canonical_comment_from_api(row)
                        matched_keywords = matcher.match_text(comment.text)
                        stats.scanned += 1
                        if matched_keywords:
                            stats.matching += 1
                        applied = await crud.apply_canonical_comment(
                            map_canonical_comment_snapshot(comment, matched_keywords),
                            post_revision,
                            allow_equal_revision=True,
                        )
                        if applied:
                            stats.applied += 1
                        else:
                            stats.stale += 1

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
