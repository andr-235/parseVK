import logging
from typing import Any, Protocol

from app.modules.content.helpers.author_helpers import (
    enrich_author_summaries_helper,
    refresh_authors_helper,
)

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

class AuthorRepositoryProto(Protocol):
    async def list_authors(self, offset: int = 0, limit: int = 20, search: str | None = None, city: str | None = None, verified: bool | None = None, author_type: str | None = None, sort_by: str | None = None, sort_order: str = "desc") -> dict: ...
    async def get_author(self, vk_author_id: int) -> dict | None: ...
    async def list_authors_bulk(self, vk_author_ids: list[int]) -> list[dict]: ...
    async def _update_author_verified_at(self, vk_author_id: int) -> bool: ...
    async def get_all_author_ids(self) -> list[int]: ...
    async def bulk_update_author_profiles(self, profiles: list[dict]) -> int: ...
    async def delete_author_and_comments(self, vk_author_id: int) -> None: ...


class AuthorContentService:
    def __init__(self, repo: AuthorRepositoryProto, photo_analysis=None):
        self._repo = repo
        self._photo_analysis = photo_analysis

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
        await enrich_author_summaries_helper(payload.get("items", []), self._photo_analysis, logger)
        return payload

    async def get_author(self, vk_author_id: int) -> dict | None:
        row = await self._repo.get_author(vk_author_id)
        if row is not None:
            await enrich_author_summaries_helper([row], self._photo_analysis, logger)
        return row

    async def list_authors_bulk(self, vk_author_ids: list[int]) -> list[dict]:
        items = await self._repo.list_authors_bulk(vk_author_ids)
        await enrich_author_summaries_helper(items, self._photo_analysis, logger)
        return items

    async def verify_author(self, vk_author_id: int) -> bool:
        return await self._repo._update_author_verified_at(vk_author_id)

    async def delete_author(self, vk_author_id: int) -> bool:
        row = await self._repo.get_author(vk_author_id)
        if row is None:
            return False
        await self._repo.delete_author_and_comments(vk_author_id)
        return True

    async def refresh_authors(self) -> int:
        return await refresh_authors_helper(self._repo, logger)

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
        return value.strip() or None if value else None

    @staticmethod
    def _normalize_sort_order(value: str | None) -> str:
        return value if value in {"asc", "desc"} else "desc"

    @staticmethod
    def _parse_optional_bool(value: Any) -> bool | None:
        if value in {True, "true", "1"}:
            return True
        if value in {False, "false", "0"}:
            return False
        return None
