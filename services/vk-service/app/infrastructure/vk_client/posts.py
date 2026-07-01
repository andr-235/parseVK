import logging
from collections.abc import Callable
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


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
        response = await self._call(
            "wall.getComments", owner_id=owner_id, post_id=post_id, count=100, extended=1,
        )
        return {
            "items": list(response.get("items") or []),
            "profiles": list(response.get("profiles") or []),
            "groups": list(response.get("groups") or []),
        }

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
            owner_id, post_id, author_vk_id,
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
        self, items: list[dict], author_vk_id: int, baseline_ts: int | None,
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
