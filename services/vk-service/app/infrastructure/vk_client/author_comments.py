from collections.abc import Callable
from datetime import datetime
from typing import Any


class AuthorCommentsClient:
    def __init__(self, call_method: Callable[..., Any]):
        self._call = call_method

    async def collect(
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
        collected: list[dict] = []

        for _ in range(max_pages):
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
            collected.extend(
                self._filter_by_author(items, author_vk_id, baseline_ts)
            )
            offset += len(items)
            if baseline_ts is not None:
                oldest = self._oldest_timestamp(items)
                if oldest is not None and oldest <= baseline_ts:
                    break
            if offset >= response.get("count", 0):
                break
        return collected

    def _filter_by_author(
        self,
        items: list[dict],
        author_vk_id: int,
        baseline_ts: int | None,
    ) -> list[dict]:
        result = []
        for item in items:
            thread = item.get("thread") or {}
            child_items = self._filter_by_author(
                thread.get("items") or [], author_vk_id, baseline_ts
            )
            matches = item.get("from_id") == author_vk_id
            is_recent = baseline_ts is None or item.get("date", 0) > baseline_ts
            if matches and is_recent:
                result.append(dict(item, thread=dict(thread, items=child_items)))
            elif child_items:
                result.extend(child_items)
        return result

    @classmethod
    def _oldest_timestamp(cls, comments: list[dict]) -> int | None:
        timestamps = [
            value
            for comment in comments
            for value in (
                comment.get("date"),
                cls._oldest_timestamp(
                    (comment.get("thread") or {}).get("items") or []
                ),
            )
            if value is not None
        ]
        return min(timestamps) if timestamps else None
