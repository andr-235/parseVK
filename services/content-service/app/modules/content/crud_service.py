import asyncio
import logging
from typing import Any, Protocol

logger = logging.getLogger(__name__)

SUPPORTED_AUTHOR_SORT_FIELDS = {
    "fullName",
    "firstName",
    "lastName",
    "followersCount",
    "verifiedAt",
    "createdAt",
    "created_at",
    "updatedAt",
}


class ContentRepo(Protocol):
    async def list_groups(self, page: int, limit: int, search: str | None = None, sort_by: str | None = None, sort_order: str = "desc") -> dict: ...
    async def get_group(self, vk_group_id: int) -> dict | None: ...
    async def search_groups(self, query: str, limit: int) -> dict: ...
    async def list_posts(self, page: int, limit: int) -> dict: ...
    async def get_post(self, external_key: str) -> dict | None: ...
    async def list_comments(self, page: int, limit: int) -> dict: ...
    async def list_authors(self, offset: int = 0, limit: int = 20, search: str | None = None, city: str | None = None, verified: bool | None = None, author_type: str | None = None, sort_by: str | None = None, sort_order: str = "desc") -> dict: ...
    async def get_author(self, vk_author_id: int) -> dict | None: ...
    async def list_authors_bulk(self, vk_author_ids: list[int]) -> list[dict]: ...
    async def list_posts_bulk(self, external_keys: list[str]) -> list[dict]: ...
    async def list_groups_bulk(self, vk_group_ids: list[int]) -> list[dict]: ...
    async def _update_author_verified_at(self, vk_author_id: int) -> bool: ...
    async def get_all_author_ids(self) -> list[int]: ...
    async def bulk_update_author_profiles(self, profiles: list[dict]) -> int: ...
    async def upsert_group(self, group: dict) -> None: ...
    async def delete_group_and_related(self, vk_group_id: int) -> None: ...
    async def delete_author_and_comments(self, vk_author_id: int) -> None: ...


class ContentCrudService:
    def __init__(self, *, repo: ContentRepo, photo_analysis=None):
        self._repo = repo
        self._photo_analysis = photo_analysis

    async def list_groups(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        return await self._repo.list_groups(
            page=page,
            limit=limit,
            search=self._normalize_text(search),
            sort_by=sort_by,
            sort_order=self._normalize_sort_order(sort_order),
        )

    async def search_groups(self, q: str, limit: int) -> dict:
        return await self._repo.search_groups(self._normalize_text(q) or q, limit)

    async def get_group(self, vk_group_id: int) -> dict | None:
        return await self._repo.get_group(vk_group_id)

    async def list_posts(self, page: int, limit: int) -> dict:
        return await self._repo.list_posts(page, limit)

    async def get_post(self, external_key: str) -> dict | None:
        return await self._repo.get_post(external_key)

    async def list_comments(self, page: int, limit: int) -> dict:
        return await self._repo.list_comments(page, limit)

    async def list_authors(
        self,
        limit: int = 20,
        page: int | None = None,
        offset: int | None = None,
        search: str | None = None,
        city: str | None = None,
        verified: str | None = None,
        author_type: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        self._validate_author_query_params(city=city, verified=verified, sort_by=sort_by)
        resolved_offset = offset if offset is not None else ((page or 1) - 1) * limit
        payload = await self._repo.list_authors(
            offset=resolved_offset,
            limit=limit,
            search=self._normalize_text(search),
            city=self._normalize_text(city),
            verified=self._parse_optional_bool(verified),
            author_type=author_type,
            sort_by=sort_by,
            sort_order=self._normalize_sort_order(sort_order),
        )
        await self._enrich_author_summaries(payload.get("items", []))
        return payload

    async def get_author(self, vk_author_id: int) -> dict | None:
        row = await self._repo.get_author(vk_author_id)
        if row is not None:
            await self._enrich_author_summaries([row])
        return row

    async def list_authors_bulk(self, vk_author_ids: list[int]) -> list[dict]:
        items = await self._repo.list_authors_bulk(vk_author_ids)
        await self._enrich_author_summaries(items)
        return items

    async def verify_author(self, vk_author_id: int) -> bool:
        return await self._repo._update_author_verified_at(vk_author_id)

    async def delete_group(self, vk_group_id: int) -> bool:
        row = await self._repo.get_group(vk_group_id)
        if row is None:
            return False
        await self._repo.delete_group_and_related(vk_group_id)
        return True

    async def delete_author(self, vk_author_id: int) -> bool:
        row = await self._repo.get_author(vk_author_id)
        if row is None:
            return False
        await self._repo.delete_author_and_comments(vk_author_id)
        return True

    async def refresh_authors(self) -> int:
        vk_author_ids = await self._repo.get_all_author_ids()
        if not vk_author_ids:
            return 0

        user_ids = [uid for uid in vk_author_ids if uid > 0]
        if not user_ids:
            return 0

        batch_size = 500
        updated_count = 0
        fields = [
            "about", "activities", "bdate", "books", "career", "city", "connections",
            "contacts", "counters", "country", "domain", "education", "followers_count",
            "home_town", "interests", "last_seen", "maiden_name", "military", "movies",
            "music", "nickname", "occupation", "personal", "photo_50", "photo_100",
            "photo_200", "photo_200_orig", "photo_400_orig", "photo_id", "photo_max",
            "photo_max_orig", "relation", "relatives", "schools", "screen_name", "sex",
            "site", "status", "timezone", "tv", "universities",
        ]

        import httpx
        from app.core.config import settings

        headers = {"X-Internal-Service-Token": settings.internal_service_token}
        vk_service_url = getattr(settings, "vk_service_base_url", "http://vk-service:8000")

        async with httpx.AsyncClient() as client:
            for i in range(0, len(user_ids), batch_size):
                chunk = user_ids[i:i + batch_size]
                try:
                    resp = await client.post(
                        f"{vk_service_url}/internal/vk/users/bulk",
                        json={"user_ids": chunk, "fields": fields},
                        headers=headers,
                        timeout=10.0,
                    )
                    resp.raise_for_status()
                    profiles = resp.json()
                    updated_count += await self._repo.bulk_update_author_profiles(profiles)
                except Exception as exc:
                    logger.warning("Failed to refresh authors chunk starting at %d: %s", i, exc)

        return updated_count

    async def list_posts_bulk(self, external_keys: list[str]) -> list[dict]:
        return await self._repo.list_posts_bulk(external_keys)

    async def list_groups_bulk(self, vk_group_ids: list[int]) -> list[dict]:
        return await self._repo.list_groups_bulk(vk_group_ids)

    async def save_group(self, group: dict) -> dict:
        await self._repo.upsert_group(group)
        row = await self._repo.get_group(int(group["id"]))
        return row or group

    async def _enrich_author_summaries(self, items: list[dict]) -> None:
        if not self._photo_analysis:
            return
        vk_author_ids = [
            int(item["vkUserId"])
            for item in items
            if item.get("vkUserId") is not None
        ]
        if not vk_author_ids:
            return

        try:
            summaries = await asyncio.wait_for(
                self._photo_analysis.summaries_by_vk_author_ids(vk_author_ids),
                timeout=getattr(self._photo_analysis, "enrichment_budget_seconds", 2.0),
            )
        except Exception as exc:
            logger.warning("Photo analysis enrichment failed: %s", exc)
            return

        for item in items:
            summary = summaries.get(int(item["vkUserId"]))
            if summary is not None:
                item["summary"] = summary
                item["photosCount"] = summary.get("total", item.get("photosCount"))

    def _validate_author_query_params(
        self,
        *,
        city: str | None,
        verified: str | None,
        sort_by: str | None,
    ) -> None:
        from fastapi import HTTPException, status
        if sort_by and sort_by not in SUPPORTED_AUTHOR_SORT_FIELDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported author sort field: {sort_by}",
            )

    @staticmethod
    def _normalize_text(value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @staticmethod
    def _normalize_sort_order(value: str | None) -> str:
        return value if value in {"asc", "desc"} else "desc"

    @staticmethod
    def _parse_optional_bool(value: Any) -> bool | None:
        if value in {None, "", "all"}:
            return None
        if value in {True, "true", "1"}:
            return True
        if value in {False, "false", "0"}:
            return False
        return None
