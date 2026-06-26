from __future__ import annotations

import logging
from typing import Any

from app.clients.moderation.client import ModerationServiceClient
from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.modules._base import forward_service_request, translate_gateway_error
from app.modules.keywords.mappers.keyword_mapper import format_job, format_keyword
from fastapi import HTTPException, UploadFile

logger = logging.getLogger("api-gateway.keywords.service")


class KeywordsGatewayService:
    def __init__(self, client: ModerationServiceClient | None = None):
        self.client = client or ModerationServiceClient()

    async def _request(self, method: str, path: str, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None, params: dict | None = None, json: Any | None = None) -> dict:
        try:
            return await forward_service_request(
                self.client,
                method,
                path,
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
                json=json,
            )
        except (BackendServiceError, BackendUnavailableError) as exc:
            raise translate_gateway_error(exc) from exc

    async def get_all_keywords(self, page: int, limit: int, search: str | None = None, enabled: bool | None = None, scope: str | None = None, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        params: dict[str, Any] = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        if enabled is not None:
            params["enabled"] = enabled
        if scope is not None:
            params["scope"] = scope
        result = await self._request("GET", "/internal/moderation/keywords", user_id=user_id, request_id=request_id, correlation_id=correlation_id, params=params)
        return {"keywords": [format_keyword(kw) for kw in result.get("items", [])], "total": result.get("total", 0), "page": result.get("page", page), "limit": result.get("limit", limit)}

    async def add_keyword(self, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        backend = {"word": payload["word"], "category": payload.get("category"), "is_phrase": payload.get("isPhrase", False)}
        result = await self._request("POST", "/internal/moderation/keywords/add", user_id=user_id, request_id=request_id, correlation_id=correlation_id, json=backend)
        return format_keyword(result)

    async def bulk_add_keywords(self, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._request("POST", "/internal/moderation/keywords/bulk-add", user_id=user_id, request_id=request_id, correlation_id=correlation_id, json=payload)

    async def upload_keywords(self, file: UploadFile, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Empty filename")
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Uploaded file exceeds 5MB size limit")
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File encoding must be UTF-8") from None
        return await self._request("POST", "/internal/moderation/keywords/upload-content", user_id=user_id, request_id=request_id, correlation_id=correlation_id, json={"content": text})

    async def update_keyword_category(self, id: int, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        result = await self._request("PATCH", f"/internal/moderation/keywords/{id}", user_id=user_id, request_id=request_id, correlation_id=correlation_id, json=payload)
        return format_keyword(result)

    async def delete_all_keywords(self, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._request("DELETE", "/internal/moderation/keywords/all", user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def delete_keyword(self, id: int, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        result = await self._request("DELETE", f"/internal/moderation/keywords/{id}", user_id=user_id, request_id=request_id, correlation_id=correlation_id)
        return format_keyword(result)

    async def get_keyword_forms(self, id: int, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._request("GET", f"/internal/moderation/keywords/{id}/forms", user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def add_manual_keyword_form(self, id: int, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._request("POST", f"/internal/moderation/keywords/{id}/forms/manual", user_id=user_id, request_id=request_id, correlation_id=correlation_id, json=payload)

    async def remove_manual_keyword_form(self, id: int, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._request("DELETE", f"/internal/moderation/keywords/{id}/forms/manual", user_id=user_id, request_id=request_id, correlation_id=correlation_id, json=payload)

    async def add_keyword_form_exclusion(self, id: int, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._request("POST", f"/internal/moderation/keywords/{id}/forms/exclusions", user_id=user_id, request_id=request_id, correlation_id=correlation_id, json=payload)

    async def remove_keyword_form_exclusion(self, id: int, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._request("DELETE", f"/internal/moderation/keywords/{id}/forms/exclusions", user_id=user_id, request_id=request_id, correlation_id=correlation_id, json=payload)

    async def recalculate_keyword_matches(self, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        raw = await self._request("POST", "/internal/moderation/keywords/recalculate-matches", user_id=user_id, request_id=request_id, correlation_id=correlation_id)
        return {"processed": raw.get("processed", 0), "updated": raw.get("updated", 0), "created": raw.get("created", 0), "deleted": raw.get("deleted", 0)}

    async def get_recalculation_job_status(self, id: int, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        raw = await self._request("GET", f"/internal/moderation/keywords/recalculation-jobs/{id}", user_id=user_id, request_id=request_id, correlation_id=correlation_id)
        return format_job(raw)

    async def rebuild_keyword_forms(self, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        raw = await self._request("POST", "/internal/moderation/keywords/rebuild-forms", user_id=user_id, request_id=request_id, correlation_id=correlation_id)
        return {"keywordsRebuilt": raw.get("keywords_rebuilt", 0), "processed": raw.get("processed", 0), "updated": raw.get("updated", 0), "created": raw.get("created", 0), "deleted": raw.get("deleted", 0)}


def get_keywords_gateway_service() -> KeywordsGatewayService:
    return KeywordsGatewayService()
