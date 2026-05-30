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
    async def get_groups(self, group_ids: list[int], fields: list[str] | None = None) -> list[dict]:
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

    async def get_groups(self, group_ids: list[int], fields: list[str] | None = None) -> list[dict]:
        if not group_ids:
            return []
        params = {"group_ids": ",".join(str(item) for item in group_ids)}
        if fields:
            params["fields"] = ",".join(fields)
        response = await self._call("groups.getById", **params)
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
        import sys
        print("!!! Starting search_groups_by_region !!!", file=sys.stderr, flush=True)
        region_title = "Еврейская автономная область"
        normalized_query = (query or "").strip()

        print(f"!!! Calling database.getRegions for '{region_title}' !!!", file=sys.stderr, flush=True)
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
            print("!!! REGION_NOT_FOUND !!!", file=sys.stderr, flush=True)
            raise ValueError("REGION_NOT_FOUND")

        region_id = region["id"]
        print(f"!!! Found region ID: {region_id} !!!", file=sys.stderr, flush=True)

        cities = []
        page_size = 1000
        offset = 0
        while True:
            print(f"!!! Calling database.getCities (offset={offset}) !!!", file=sys.stderr, flush=True)
            cities_response = await self._call(
                "database.getCities",
                country_id=1,
                region_id=region_id,
                need_all=1,
                count=page_size,
                offset=offset,
            )
            city_items = cities_response.get("items") or []
            print(f"!!! Retrieved {len(city_items)} cities from database.getCities !!!", file=sys.stderr, flush=True)
            if not city_items:
                break
            for c in city_items:
                if isinstance(c.get("id"), int) and c.get("title"):
                    cities.append({"id": c["id"], "title": c["title"]})
            offset += len(city_items)
            if offset >= cities_response.get("count", 0) or len(city_items) < page_size:
                break

        print(f"!!! Total cities found: {len(cities)} !!!", file=sys.stderr, flush=True)
        if not cities:
            return []

        # Ограничиваемся первыми 15 наиболее крупными городами/селами региона,
        # чтобы избежать таймаутов и превышения лимитов VK API на мелких деревнях
        cities_to_search = cities[:15]
        print(f"!!! Limiting search to {len(cities_to_search)} cities !!!", file=sys.stderr, flush=True)

        unique_groups = {}
        page_size = 200
        for index, city in enumerate(cities_to_search):
            city_id = city["id"]
            city_title = city["title"]
            
            # Делаем паузу между запросами к VK API, чтобы не превысить лимит 3 запроса/сек
            if index > 0:
                await asyncio.sleep(0.35)
                
            # Если query не передан, ищем по названию города
            search_query = normalized_query if normalized_query else city_title
            
            print(f"!!! [{index+1}/{len(cities_to_search)}] Searching groups in city '{city_title}' (id={city_id}) with q='{search_query}' !!!", file=sys.stderr, flush=True)
            try:
                search_response = await self._call(
                    "groups.search",
                    q=search_query,
                    country_id=1,
                    city_id=city_id,
                    count=page_size,
                )
                search_items = search_response.get("items") or []
                print(f"!!! [{index+1}/{len(cities_to_search)}] Found {len(search_items)} groups in '{city_title}' !!!", file=sys.stderr, flush=True)
                for item in search_items:
                    unique_groups[item["id"]] = item
            except Exception as exc:
                import sys
                print(f"!!! Error searching groups for city {city_title} ({city_id}): {exc} !!!", file=sys.stderr, flush=True)

        print(f"!!! Total unique groups found across region: {len(unique_groups)} !!!", file=sys.stderr, flush=True)
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
        city_ids_set = {c["id"] for c in cities}
        for index, i in enumerate(range(0, len(ids), chunk_size)):
            if index > 0:
                await asyncio.sleep(0.35)
            chunk = ids[i : i + chunk_size]
            print(f"!!! Enriching chunk {index+1} ({len(chunk)} groups) using groups.getById !!!", file=sys.stderr, flush=True)
            try:
                response = await self._call(
                    "groups.getById",
                    group_ids=",".join(str(item) for item in chunk),
                    fields=",".join(fields),
                )
                details = response.get("groups") if isinstance(response, dict) and "groups" in response else response
                for d in details or []:
                    base = unique_groups.get(d["id"]) or {}
                    merged = {**base, **d}
                    
                    # Проверяем принадлежность к нашему региону по ID населенного пункта
                    group_city = merged.get("city")
                    if group_city and isinstance(group_city, dict):
                        g_city_id = group_city.get("id")
                        if g_city_id and g_city_id not in city_ids_set:
                            # Пропускаем группу из другого региона
                            continue
                            
                    enriched[d["id"]] = merged
            except Exception as exc:
                print(f"!!! Error enriching chunk {index+1}: {exc} !!!", file=sys.stderr, flush=True)

        print(f"!!! Enrichment complete. Returning {len(enriched)} groups !!!", file=sys.stderr, flush=True)
        return list(enriched.values())


