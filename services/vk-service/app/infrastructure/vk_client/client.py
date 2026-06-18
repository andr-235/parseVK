import asyncio
from datetime import datetime

from app.infrastructure.vk_client.base import VkApiBaseClient, VkApiConfigurationError
from app.domain.ports.vk_api import VkApiPort

# Re-export for backward compatibility
VkApiAdapter = VkApiPort

__all__ = ["VkApiClient", "VkApiAdapter", "VkApiConfigurationError"]


class VkApiClient(VkApiBaseClient):
    async def get_groups(self, group_ids: list[int], fields: list[str] | None = None) -> list[dict]:
        if not group_ids:
            return []
        params = {"group_ids": ",".join(str(group_id) for group_id in group_ids)}
        if fields:
            params["fields"] = ",".join(fields)
        response = await self._call("groups.getById", **params)
        if isinstance(response, dict) and "groups" in response:
            return list(response["groups"])
        return list(response)

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int | None) -> dict:
        count = post_limit or 10
        owner_id = -abs(group_id)
        response = await self._call("wall.get", owner_id=owner_id, count=count, extended=1)
        return {
            "items": list(response.get("items") or []),
            "profiles": list(response.get("profiles") or []),
            "groups": list(response.get("groups") or []),
        }

    async def get_comments(self, owner_id: int, post_id: int) -> dict:
        response = await self._call(
            "wall.getComments", owner_id=owner_id, post_id=post_id, count=100, extended=1
        )
        return {
            "items": list(response.get("items") or []),
            "profiles": list(response.get("profiles") or []),
            "groups": list(response.get("groups") or []),
        }

    async def search_groups_by_region(self, *, query: str | None = None) -> list[dict]:
        region_title = "Еврейская автономная область"
        normalized_query = (query or "").strip()

        regions_response = await self._call(
            "database.getRegions",
            country_id=1,
            q=region_title,
            need_all=1,
            count=1000,
        )
        region_items = regions_response.get("items") or []
        region = next((item for item in region_items if item.get("title") == region_title), None)
        if not region:
            raise ValueError("REGION_NOT_FOUND")

        region_id = region["id"]

        cities: list[dict] = []
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
            for city_item in city_items:
                if isinstance(city_item.get("id"), int) and city_item.get("title"):
                    cities.append({"id": city_item["id"], "title": city_item["title"]})
            offset += len(city_items)
            if offset >= cities_response.get("count", 0) or len(city_items) < page_size:
                break

        if not cities:
            return []

        cities_to_search = cities[:15]

        unique_groups: dict[int, dict] = {}
        search_page_size = 200
        for city_index, city in enumerate(cities_to_search):
            city_id = city["id"]
            city_title = city["title"]

            if city_index > 0:
                await asyncio.sleep(0.35)

            search_query = normalized_query if normalized_query else city_title

            try:
                search_response = await self._call(
                    "groups.search",
                    q=search_query,
                    country_id=1,
                    city_id=city_id,
                    count=search_page_size,
                )
                for item in search_response.get("items") or []:
                    unique_groups[item["id"]] = item
            except Exception:
                pass

        if not unique_groups:
            return []

        group_ids = list(unique_groups.keys())
        chunk_size = 400
        enriched: dict[int, dict] = {}
        detail_fields = [
            "members_count", "city", "activity", "status", "verified",
            "description", "addresses", "contacts", "site",
        ]
        city_ids_set = {city["id"] for city in cities}

        for chunk_index, chunk_start in enumerate(range(0, len(group_ids), chunk_size)):
            if chunk_index > 0:
                await asyncio.sleep(0.35)
            chunk = group_ids[chunk_start: chunk_start + chunk_size]
            try:
                response = await self._call(
                    "groups.getById",
                    group_ids=",".join(str(group_id) for group_id in chunk),
                    fields=",".join(detail_fields),
                )
                details = (
                    response.get("groups")
                    if isinstance(response, dict) and "groups" in response
                    else response
                )
                for group_detail in details or []:
                    base_group = unique_groups.get(group_detail["id"]) or {}
                    merged_group = {**base_group, **group_detail}

                    group_city = merged_group.get("city")
                    if group_city and isinstance(group_city, dict):
                        group_city_id = group_city.get("id")
                        if group_city_id and group_city_id not in city_ids_set:
                            continue

                    enriched[group_detail["id"]] = merged_group
            except Exception:
                pass

        return list(enriched.values())

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
            user_ids=",".join(str(user_id) for user_id in user_ids),
            fields=",".join(fields),
        )
        if isinstance(response, dict) and "response" in response:
            return list(response["response"])
        return list(response)

    async def friends_get(self, **params) -> dict:
        return await self._call("friends.get", **params)

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

            child_items: list[dict] = []
            if thread_items:
                child_items = self._filter_comments_by_author(thread_items, author_vk_id, baseline_ts)

            is_author_comment = item.get("from_id") == author_vk_id
            is_after_baseline = baseline_ts is None or item.get("date", 0) > baseline_ts

            if is_author_comment and is_after_baseline:
                comment_copy = dict(item)
                comment_copy["thread"] = dict(thread, items=child_items)
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
