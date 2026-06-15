import logging
from collections.abc import Callable
from typing import Any

from fastapi import UploadFile

logger = logging.getLogger("api-gateway.keywords.crud")


class KeywordCrudService:
    def __init__(self, request: Callable, format_keyword: Callable):
        self._request = request
        self._format_keyword = format_keyword

    async def get_all_keywords(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("KeywordCrudService.get_all_keywords: page=%d, limit=%d, search=%s", page, limit, search)
        params: dict[str, Any] = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        result = await self._request(
            "GET", "/internal/moderation/keywords",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
            params=params,
        )
        return {
            "items": [self._format_keyword(kw) for kw in result.get("items", [])],
            "total": result.get("total", 0),
            "page": result.get("page", page),
            "limit": result.get("limit", limit),
        }

    async def add_keyword(
        self,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("KeywordCrudService.add_keyword")
        result = await self._request(
            "POST", "/internal/moderation/keywords/add",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
            json=payload,
        )
        logger.info("KeywordCrudService.add_keyword: keyword added successfully")
        return self._format_keyword(result)

    async def bulk_add_keywords(
        self,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("KeywordCrudService.bulk_add_keywords")
        result = await self._request(
            "POST", "/internal/moderation/keywords/bulk-add",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
            json=payload,
        )
        logger.info("KeywordCrudService.bulk_add_keywords: bulk add completed")
        return result

    async def upload_keywords(
        self,
        file: UploadFile,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("KeywordCrudService.upload_keywords: file=%s", file.filename)
        content = (await file.read()).decode("utf-8") if file.file else ""
        result = await self._request(
            "POST", "/internal/moderation/keywords/upload-content",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
            json={"content": content},
        )
        logger.info("KeywordCrudService.upload_keywords: upload completed")
        return result

    async def update_keyword_category(
        self,
        id: int,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("KeywordCrudService.update_keyword_category: id=%d", id)
        result = await self._request(
            "PATCH", f"/internal/moderation/keywords/{id}",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
            json=payload,
        )
        logger.info("KeywordCrudService.update_keyword_category: updated keyword %d", id)
        return self._format_keyword(result)

    async def delete_all_keywords(
        self,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("KeywordCrudService.delete_all_keywords")
        result = await self._request(
            "DELETE", "/internal/moderation/keywords/all",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
        )
        logger.info("KeywordCrudService.delete_all_keywords: all keywords deleted")
        return result

    async def delete_keyword(
        self,
        id: int,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("KeywordCrudService.delete_keyword: id=%d", id)
        result = await self._request(
            "DELETE", f"/internal/moderation/keywords/{id}",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
        )
        logger.info("KeywordCrudService.delete_keyword: keyword %d deleted", id)
        return self._format_keyword(result)
