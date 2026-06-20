import asyncio
import logging
from typing import Any

from app.domain.content.clients import PhotoSummaryClient
from app.domain.content.errors import InvalidFilterError
from app.domain.content.repositories import AuthorRepository

logger = logging.getLogger(__name__)

SUPPORTED_SORT_FIELDS = {
    "fullName",
    "firstName",
    "lastName",
    "followersCount",
    "verifiedAt",
    "createdAt",
    "created_at",
    "updatedAt",
}


class AuthorQueryService:
    def __init__(
        self,
        repository: AuthorRepository,
        summaries: PhotoSummaryClient | None = None,
    ):
        self.repository = repository
        self.summaries = summaries

    async def list_authors(
        self,
        *,
        limit: int = 20,
        page: int | None = None,
        offset: int | None = None,
        search: str | None = None,
        city: str | None = None,
        verified: str | bool | None = None,
        author_type: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> dict:
        if sort_by and sort_by not in SUPPORTED_SORT_FIELDS:
            raise InvalidFilterError("sort_by", sort_by)
        resolved_offset = offset if offset is not None else ((page or 1) - 1) * limit
        payload = await self.repository.list_authors(
            offset=resolved_offset,
            limit=limit,
            search=self._text(search),
            city=self._text(city),
            verified=self._optional_bool(verified),
            author_type=author_type,
            sort_by=sort_by,
            sort_order=sort_order if sort_order in {"asc", "desc"} else "desc",
        )
        await self._enrich(payload.get("items", []))
        return payload

    async def get_author(self, vk_author_id: int) -> dict | None:
        author = await self.repository.get_author(vk_author_id)
        if author:
            await self._enrich([author])
        return author

    async def list_authors_bulk(self, ids: list[int]) -> list[dict]:
        authors = await self.repository.list_authors_bulk(ids)
        await self._enrich(authors)
        return authors

    async def _enrich(self, authors: list[dict]) -> None:
        ids = [int(item["vkUserId"]) for item in authors if item.get("vkUserId") is not None]
        if not self.summaries or not ids:
            return
        try:
            values = await asyncio.wait_for(
                self.summaries.summaries_by_vk_author_ids(ids),
                timeout=self.summaries.enrichment_budget_seconds,
            )
        except Exception as exc:
            logger.warning("Author summary enrichment unavailable: %s", type(exc).__name__)
            return
        for author in authors:
            summary = values.get(int(author["vkUserId"]))
            if summary:
                author["summary"] = summary
                author["photosCount"] = summary.get("total", author.get("photosCount"))

    @staticmethod
    def _text(value: str | None) -> str | None:
        return value.strip() or None if value else None

    @staticmethod
    def _optional_bool(value: Any) -> bool | None:
        if value in {True, "true", "1"}:
            return True
        if value in {False, "false", "0"}:
            return False
        return None
