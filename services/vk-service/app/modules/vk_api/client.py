import asyncio
from datetime import datetime
from typing import Protocol

try:
    import vk_api
except ImportError:  # pragma: no cover - dependency is installed in the service image.
    vk_api = None

from app.core.config import settings
from app.core.redaction import redact_secrets

VK_API_VERSION = "5.199"


class VkApiAdapter(Protocol):
    async def get_groups(self, group_ids: list[int]) -> list[dict]:
        raise NotImplementedError

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int | None) -> list[dict]:
        raise NotImplementedError

    async def get_comments(self, owner_id: int, post_id: int) -> list[dict]:
        raise NotImplementedError

    async def search_groups_by_region(self, *, query: str | None = None) -> list[dict]:
        raise NotImplementedError

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
        raise NotImplementedError

    async def get_user_photos(self, user_id: int, count: int = 100, offset: int = 0) -> list[dict]:
        raise NotImplementedError



class VkApiConfigurationError(RuntimeError):
    pass


class VkApiClient:
    def __init__(self, *, token: str | None = None, vk_session_factory=None, call_runner=None):
        self.token = token if token is not None else settings.vk_token
        self._vk_session_factory = vk_session_factory or self._default_vk_session_factory
        self._call_runner = call_runner or self._run_in_thread
        self._api = None

    def _default_vk_session_factory(self, **kwargs):
        if vk_api is None:
            raise VkApiConfigurationError("vk_api package is not installed")
        return vk_api.VkApi(**kwargs)

    def _get_api(self):
        if not self.token:
            raise VkApiConfigurationError("VK token is not configured")
        if self._api is None:
            session = self._vk_session_factory(token=self.token, api_version=VK_API_VERSION)
            self._api = session.get_api()
        return self._api

    def _call_sync(self, method: str, **params) -> dict:
        target = self._get_api()
        for part in method.split("."):
            target = getattr(target, part)
        try:
            return target(**params)
        except Exception as exc:
            raise RuntimeError(self._safe_error_message(exc)) from exc

    async def _call(self, method: str, **params) -> dict:
        return await self._call_runner(self._call_sync, method, **params)

    async def _run_in_thread(self, func, *args, **kwargs):
        return await asyncio.to_thread(func, *args, **kwargs)

    def _safe_error_message(self, exc: Exception) -> str:
        message = str(exc) or "VK API error"
        return redact_secrets(message)

    async def get_groups(self, group_ids: list[int]) -> list[dict]:
        if not group_ids:
            return []
        response = await self._call("groups.getById", group_ids=",".join(str(item) for item in group_ids))
        if isinstance(response, dict) and "groups" in response:
            return list(response["groups"])
        return list(response)

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int | None) -> list[dict]:
        count = post_limit or 10
        owner_id = -abs(group_id)
        response = await self._call("wall.get", owner_id=owner_id, count=count)
        return list(response.get("items") or [])

    async def get_comments(self, owner_id: int, post_id: int) -> list[dict]:
        response = await self._call("wall.getComments", owner_id=owner_id, post_id=post_id, count=100)
        return list(response.get("items") or [])

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
        collected = []

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

            filtered = self._filter_comments_by_author(
                items,
                author_vk_id,
                baseline_ts,
            )

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

            child_items = []
            if thread_items:
                child_items = self._filter_comments_by_author(
                    thread_items,
                    author_vk_id,
                    baseline_ts,
                )

            is_author_comment = item.get("from_id") == author_vk_id
            is_after_baseline = baseline_ts is None or item.get("date", 0) > baseline_ts

            if is_author_comment and is_after_baseline:
                comment_copy = dict(item)
                if child_items:
                    comment_copy["thread"] = dict(thread, items=child_items)
                else:
                    comment_copy["thread"] = dict(thread, items=[])
                result.append(comment_copy)
            elif child_items:
                result.extend(child_items)

        return result

    def _find_oldest_timestamp(self, comments: list[dict]) -> int | None:
        oldest = None
        for comment in comments:
            date = comment.get("date")
            if date is not None:
                if oldest is None or date < oldest:
                    oldest = date

            thread = comment.get("thread") or {}
            thread_items = thread.get("items") or []
            if thread_items:
                nested_oldest = self._find_oldest_timestamp(thread_items)
                if nested_oldest is not None:
                    if oldest is None or nested_oldest < oldest:
                        oldest = nested_oldest
        return oldest

    async def get_user_photos(self, user_id: int, count: int = 100, offset: int = 0) -> list[dict]:
        response = await self._call(
            "photos.getAll",
            owner_id=user_id,
            count=min(max(count, 1), 200),
            offset=offset,
            extended=0,
            photo_sizes=1,
        )
        return list(response.get("items") or [])

    async def get_users(self, user_ids: list[int], fields: list[str]) -> list[dict]:
        if not user_ids:
            return []
        response = await self._call(
            "users.get",
            user_ids=",".join(str(item) for item in user_ids),
            fields=",".join(fields),
        )
        if isinstance(response, dict) and "response" in response:
            return list(response["response"])
        return list(response)

    async def friends_get(self, **params) -> dict:
        return await self._call("friends.get", **params)

    async def search_groups_by_region(self, *, query: str | None = None) -> list[dict]:
        region_title = "Еврейская автономная область"
        normalized_query = (query or "").strip()
        search_query = normalized_query if normalized_query else " "

        regions_response = await self._call(
            "database.getRegions",
            country_id=1,
            q=region_title,
            need_all=1,
            count=1000,
        )
        items = regions_response.get("items") or []
        region = next((item for item in items if item.get("title") == region_title), None)
        if not region:
            raise ValueError("REGION_NOT_FOUND")

        region_id = region["id"]

        city_ids = []
        page_size = 1000
        offset = 0
        while True:
            cities_response = await self._call(
                "database.getCities",
                country_id=1,
                region_id=region_id,
                need_all=1,
                count=page_size,
                offset=offset,
            )
            city_items = cities_response.get("items") or []
            if not city_items:
                break
            for c in city_items:
                if isinstance(c.get("id"), int):
                    city_ids.append(c["id"])
            offset += len(city_items)
            if offset >= cities_response.get("count", 0) or len(city_items) < page_size:
                break

        if not city_ids:
            return []

        unique_groups = {}
        page_size = 200
        for city_id in city_ids:
            offset = 0
            while True:
                search_response = await self._call(
                    "groups.search",
                    q=search_query,
                    country_id=1,
                    city_id=city_id,
                    count=page_size,
                    offset=offset,
                )
                search_items = search_response.get("items") or []
                if not search_items:
                    break
                for item in search_items:
                    unique_groups[item["id"]] = item
                offset += len(search_items)
                if offset >= search_response.get("count", 0) or len(search_items) < page_size:
                    break

        if not unique_groups:
            return []

        ids = list(unique_groups.keys())
        chunk_size = 400
        enriched = {}
        fields = [
            "members_count",
            "city",
            "activity",
            "status",
            "verified",
            "description",
            "addresses",
            "contacts",
            "site",
        ]
        for i in range(0, len(ids), chunk_size):
            chunk = ids[i : i + chunk_size]
            try:
                response = await self._call(
                    "groups.getById",
                    group_ids=",".join(str(item) for item in chunk),
                    fields=",".join(fields),
                )
                details = response.get("groups") if isinstance(response, dict) and "groups" in response else response
                for d in details or []:
                    base = unique_groups.get(d["id"]) or {}
                    enriched[d["id"]] = {**base, **d}
            except Exception:
                pass

        return list(enriched.values())


