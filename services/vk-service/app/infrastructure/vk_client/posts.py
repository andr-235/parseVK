import asyncio
import logging
import random
import re
from collections.abc import AsyncIterator, Callable
from datetime import datetime
from typing import Any

import httpx

from app.domain.exceptions.vk_api import (
    VkApiDomainError,
    VkApiInfrastructureError,
    VkApiRateLimitError,
)

logger = logging.getLogger(__name__)


def _redact_secrets(message: str) -> str:
    """Remove potential secrets from log messages."""
    return re.sub(
        r"(access_token=[^&\s]+|vk1\.[A-Za-z0-9_.\-]+|[a-fA-F0-9]{64,})",
        "<redacted>",
        message,
    )


class PostsClient:
    def __init__(self, call_method: Callable[..., Any]):
        self._call = call_method

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int | None) -> dict:
        count = post_limit or 10
        owner_id = -abs(group_id)
        logger.debug("wall.get for owner_id=%d count=%d", owner_id, count)
        response = await self._call("wall.get", owner_id=owner_id, count=count, extended=1)
        return {
            "items": list(response.get("items") or []),
            "profiles": list(response.get("profiles") or []),
            "groups": list(response.get("groups") or []),
        }

    async def get_comments(self, owner_id: int, post_id: int) -> dict:
        logger.debug("wall.getComments for owner_id=%d post_id=%d", owner_id, post_id)
        try:
            response = await self._call(
                "wall.getComments",
                owner_id=owner_id,
                post_id=post_id,
                count=100,
                extended=1,
            )
        except VkApiDomainError as exc:
            if exc.code == 212:
                logger.warning(
                    "Post %d_%d: access to comments denied (VK error 212), skipping",
                    owner_id,
                    post_id,
                )
                return {"items": [], "profiles": [], "groups": []}
            raise
        return {
            "items": list(response.get("items") or []),
            "profiles": list(response.get("profiles") or []),
            "groups": list(response.get("groups") or []),
        }

    async def _iter_page_with_retry(
        self,
        owner_id: int,
        post_id: int,
        offset: int,
        page_size: int,
        thread_items_count: int,
        *,
        max_retries: int,
        max_rate_limit_retries: int,
    ) -> dict:
        """Fetch a single comment page with per-page retry/backoff."""
        last_exc: Exception | None = None

        for attempt in range(1, max(max_retries, max_rate_limit_retries) + 1):
            try:
                params: dict[str, Any] = {
                    "owner_id": owner_id,
                    "post_id": post_id,
                    "count": page_size,
                    "offset": offset,
                    "extended": 1,
                }
                if thread_items_count > 0:
                    params["thread_items_count"] = thread_items_count

                logger.debug(
                    "Calling wall.getComments owner_id=%d post_id=%d offset=%d attempt=%d",
                    owner_id,
                    post_id,
                    offset,
                    attempt,
                )
                return await self._call("wall.getComments", **params)

            except (VkApiRateLimitError, VkApiInfrastructureError, httpx.RequestError) as exc:
                last_exc = exc
                is_rate_limit = isinstance(exc, VkApiRateLimitError)
                actual_max = max_rate_limit_retries if is_rate_limit else max_retries

                if attempt >= actual_max:
                    logger.error(
                        "Retry exhaustion for owner_id=%d post_id=%d offset=%d: %s",
                        owner_id,
                        post_id,
                        offset,
                        _redact_secrets(str(exc)),
                    )
                    raise

                # Jitter does not need cryptographic randomness; using stdlib random for backoff.
                delay = min(2**attempt * 1, 30) * (0.5 + random.random() * 0.5)  # noqa: S311
                if is_rate_limit:
                    logger.info(
                        "Rate limit on owner_id=%d post_id=%d offset=%d: "
                        "retrying in %.2fs (attempt %d/%d)",
                        owner_id,
                        post_id,
                        offset,
                        delay,
                        attempt,
                        actual_max,
                    )
                else:
                    logger.warning(
                        "Transient error on owner_id=%d post_id=%d offset=%d: "
                        "retrying in %.2fs (attempt %d/%d): %s",
                        owner_id,
                        post_id,
                        offset,
                        delay,
                        attempt,
                        actual_max,
                        _redact_secrets(str(exc)),
                    )
                await asyncio.sleep(delay)

            except VkApiDomainError as exc:
                if exc.code == 212:
                    logger.warning(
                        "Post %d_%d: access to comments denied (VK error 212), skipping",
                        owner_id,
                        post_id,
                    )
                    return {"items": [], "profiles": [], "groups": []}
                raise

            except (TimeoutError, asyncio.CancelledError):
                logger.debug(
                    "Cancelling/timeout for owner_id=%d post_id=%d offset=%d, no retry",
                    owner_id,
                    post_id,
                    offset,
                )
                raise

        # Defensive fallback; should be unreachable because the loop either returns or raises.
        raise RuntimeError(
            f"Unexpected retry loop exit for owner_id={owner_id} post_id={post_id} offset={offset}"
        ) from last_exc

    async def iter_comment_pages(
        self,
        owner_id: int,
        post_id: int,
        start_offset: int = 0,
        page_size: int = 100,
        max_retries: int = 3,
        max_rate_limit_retries: int = 5,
        thread_items_count: int = 0,
    ) -> AsyncIterator[dict]:
        """Asynchronously iterate comment pages for a wall post.

        Yields normalized entity collections together with provider response metadata.
        Stops when a page contains no items or the offset reaches the total count.
        """
        offset = start_offset
        page_count = 0

        logger.debug(
            "[iter_comment_pages] START owner_id=%d post_id=%d start_offset=%d page_size=%d "
            "thread_items_count=%d",
            owner_id,
            post_id,
            start_offset,
            page_size,
            thread_items_count,
        )

        while True:
            page_count += 1
            logger.debug(
                "Fetching comment page owner_id=%d post_id=%d offset=%d page_count=%d",
                owner_id,
                post_id,
                offset,
                page_count,
            )

            try:
                response = await self._iter_page_with_retry(
                    owner_id,
                    post_id,
                    offset,
                    page_size,
                    thread_items_count,
                    max_retries=max_retries,
                    max_rate_limit_retries=max_rate_limit_retries,
                )
            except (TimeoutError, asyncio.CancelledError):
                raise

            items = response.get("items") or []
            profiles = response.get("profiles") or []
            groups = response.get("groups") or []

            logger.debug(
                "Comment page %d for owner_id=%d post_id=%d: %d items, %d profiles, %d groups",
                page_count,
                owner_id,
                post_id,
                len(items),
                len(profiles),
                len(groups),
            )

            page = {
                "items": list(items),
                "profiles": list(profiles),
                "groups": list(groups),
            }
            if items:
                page.update(
                    {
                        key: value
                        for key, value in response.items()
                        if key not in {"items", "profiles", "groups"}
                    }
                )
            yield page

            if not items:
                break

            offset += len(items)
            total_count = response.get("count", 0)
            if offset >= total_count:
                logger.debug(
                    "Reached end of comments for owner_id=%d post_id=%d offset=%d total_count=%d",
                    owner_id,
                    post_id,
                    offset,
                    total_count,
                )
                break

        logger.debug(
            "[iter_comment_pages] END owner_id=%d post_id=%d pages=%d",
            owner_id,
            post_id,
            page_count,
        )

    async def get_author_comments_for_post(
        self,
        owner_id: int,
        post_id: int,
        author_vk_id: int,
        baseline: datetime | None = None,
        batch_size: int = 100,
        max_pages: int = 10,
        thread_items_count: int = 10,
    ) -> list[dict]:
        baseline_ts = int(baseline.timestamp()) if baseline else None
        offset = 0
        page = 0
        collected: list[dict] = []

        logger.debug(
            "wall.getComments author filter owner_id=%d post_id=%d author_vk_id=%d",
            owner_id,
            post_id,
            author_vk_id,
        )

        while page < max_pages:
            response = await self._call(
                "wall.getComments",
                owner_id=owner_id,
                post_id=post_id,
                need_likes=0,
                extended=0,
                count=batch_size,
                offset=offset,
                sort="desc",
                thread_items_count=thread_items_count,
            )

            items = response.get("items") or []
            if not items:
                break

            filtered = self._filter_comments_by_author(items, author_vk_id, baseline_ts)
            if filtered:
                collected.extend(filtered)

            offset += len(items)
            page += 1

            if baseline_ts is not None:
                oldest = self._find_oldest_timestamp(items)
                if oldest is not None and oldest <= baseline_ts:
                    break

            if offset >= response.get("count", 0):
                break

        return collected

    def _filter_comments_by_author(
        self,
        items: list[dict],
        author_vk_id: int,
        baseline_ts: int | None,
    ) -> list[dict]:
        result = []
        for item in items:
            thread = item.get("thread") or {}
            thread_items = thread.get("items") or []
            child_items = (
                self._filter_comments_by_author(thread_items, author_vk_id, baseline_ts)
                if thread_items
                else []
            )

            is_author_comment = item.get("from_id") == author_vk_id
            is_after_baseline = baseline_ts is None or item.get("date", 0) > baseline_ts

            if is_author_comment and is_after_baseline:
                comment_copy = dict(item)
                comment_copy["thread"] = dict(thread, items=child_items)
                result.append(comment_copy)
            elif child_items:
                result.extend(child_items)

        return result

    @staticmethod
    def _find_oldest_timestamp(comments: list[dict]) -> int | None:
        oldest = None
        for comment in comments:
            date = comment.get("date")
            if date is not None:
                if oldest is None or date < oldest:
                    oldest = date
            thread = comment.get("thread") or {}
            thread_items = thread.get("items") or []
            if thread_items:
                nested_oldest = PostsClient._find_oldest_timestamp(thread_items)
                if nested_oldest is not None:
                    if oldest is None or nested_oldest < oldest:
                        oldest = nested_oldest
        return oldest
