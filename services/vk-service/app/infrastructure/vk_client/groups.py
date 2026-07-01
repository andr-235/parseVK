import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)


class GroupsClient:
    def __init__(self, call_method: Callable[..., Any]):
        self._call = call_method

    async def get_groups(self, group_ids: list[int], fields: list[str] | None = None) -> list[dict]:
        if not group_ids:
            return []
        params = {"group_ids": ",".join(str(gid) for gid in group_ids)}
        if fields:
            params["fields"] = ",".join(fields)
        logger.debug("groups.getById with %d group_ids", len(group_ids))
        response = await self._call("groups.getById", **params)
        if isinstance(response, dict) and "groups" in response:
            return list(response["groups"])
        return list(response)

    async def search_groups_by_region(self, *, query: str | None = None) -> list[dict]:
        region_title = "Еврейская автономная область"
        normalized_query = (query or "").strip()

        logger.debug("database.getRegions for region=%s", region_title)
        regions_response = await self._call(
            "database.getRegions", country_id=1, q=region_title, need_all=1, count=1000,
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
                country_id=1, region_id=region_id, need_all=1, count=page_size, offset=offset,
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
                import asyncio
                await asyncio.sleep(0.35)

            search_query = normalized_query if normalized_query else city_title

            try:
                search_response = await self._call(
                    "groups.search",
                    q=search_query, country_id=1, city_id=city_id, count=search_page_size,
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
                import asyncio
                await asyncio.sleep(0.35)
            chunk = group_ids[chunk_start: chunk_start + chunk_size]
            try:
                response = await self._call(
                    "groups.getById",
                    group_ids=",".join(str(gid) for gid in chunk),
                    fields=",".join(detail_fields),
                )
                details = (
                    response.get("groups")
                    if isinstance(response, dict) and "groups" in response
                    else response
                )
                for group_detail in details or []:
                    base_group = unique_groups.get(group_detail["id"]) or {}
                    merged = {**base_group, **group_detail}
                    group_city = merged.get("city")
                    if group_city and isinstance(group_city, dict):
                        group_city_id = group_city.get("id")
                        if group_city_id and group_city_id not in city_ids_set:
                            continue
                    enriched[group_detail["id"]] = merged
            except Exception:
                pass

        return list(enriched.values())
