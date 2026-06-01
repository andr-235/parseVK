from typing import Any

from app.clients.moderation.client import (
    ModerationClient,
    ModerationClientHTTPError,
    ModerationClientUnavailableError,
)
from fastapi import HTTPException, UploadFile, status


class KeywordsGatewayService:
    def __init__(self, moderation_client: ModerationClient | None = None):
        self.moderation_client = moderation_client or ModerationClient()
        self.moderation_url = self.moderation_client.base_url

    async def _request(
        self,
        method: str,
        path: str,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
        params: dict | None = None,
        json: Any | None = None,
    ) -> dict:
        try:
            return await self.moderation_client.request(
                method,
                path,
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
                json=json,
            )
        except ModerationClientHTTPError as exc:
            detail = (
                exc.detail.get("detail", exc.detail)
                if isinstance(exc.detail, dict)
                else exc.detail
            )
            raise HTTPException(status_code=exc.status_code, detail=detail) from exc
        except ModerationClientUnavailableError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Moderation service unavailable",
            ) from exc

    def _format_job(self, job: dict) -> dict:
        return {
            "id": job["id"],
            "status": job["status"],
            "singleKeywordId": job.get("single_keyword_id"),
            "startedAt": job.get("started_at"),
            "finishedAt": job.get("finished_at"),
            "error": job.get("error"),
            "requestedBy": job.get("requested_by"),
            "createdAt": job.get("created_at"),
        }

    def _format_keyword(self, kw: dict) -> dict:
        return {
            "id": kw["id"],
            "word": kw["word"],
            "category": kw.get("category"),
            "isPhrase": kw.get("is_phrase", False),
            "createdAt": kw.get("created_at"),
            "updatedAt": kw.get("updated_at"),
        }

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
        params = {"page": page, "limit": limit}
        if search:
            params["search"] = search

        raw = await self._request(
            "GET",
            "/internal/moderation/keywords",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params=params,
        )
        return {
            "keywords": [self._format_keyword(kw) for kw in raw["keywords"]],
            "total": raw["total"],
            "page": raw["page"],
            "limit": raw["limit"],
        }

    async def add_keyword(
        self,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        # Адаптация camelCase фронтенда к snake_case бэкенда
        body = {
            "word": payload.get("word"),
            "category": payload.get("category"),
            "is_phrase": payload.get("isPhrase", False),
        }
        raw = await self._request(
            "POST",
            "/internal/moderation/keywords/add",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json=body,
        )
        return self._format_keyword(raw)

    async def bulk_add_keywords(
        self,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        raw = await self._request(
            "POST",
            "/internal/moderation/keywords/bulk-add",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json={"words": payload.get("words", [])},
        )
        return {
            "success": [self._format_keyword(kw) for kw in raw["success"]],
            "failed": raw["failed"],
            "total": raw["stats"]["total"],
            "successCount": raw["stats"]["success"],
            "failedCount": raw["stats"]["failed"],
            "createdCount": raw["stats"]["created"],
            "updatedCount": raw["stats"]["updated"],
        }

    async def upload_keywords(
        self,
        file: UploadFile,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        # Валидация пустого файла и размера (до 5 МБ)
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty filename",
            )

        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty",
            )

        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file exceeds 5MB size limit",
            )

        try:
            content_str = contents.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File encoding must be UTF-8",
            ) from exc

        raw = await self._request(
            "POST",
            "/internal/moderation/keywords/upload-content",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json={"content": content_str},
        )
        return {
            "success": [self._format_keyword(kw) for kw in raw["success"]],
            "failed": raw["failed"],
            "total": raw["stats"]["total"],
            "successCount": raw["stats"]["success"],
            "failedCount": raw["stats"]["failed"],
            "createdCount": raw["stats"]["created"],
            "updatedCount": raw["stats"]["updated"],
        }

    async def update_keyword_category(
        self,
        id: int,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        raw = await self._request(
            "PATCH",
            f"/internal/moderation/keywords/{id}",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json={"category": payload.get("category")},
        )
        return self._format_keyword(raw)

    async def delete_all_keywords(
        self,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        raw = await self._request(
            "DELETE",
            "/internal/moderation/keywords/all",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        # Мапим count для фронтенда IDeleteResponse
        return {"count": raw.get("count", 0)}

    async def delete_keyword(
        self,
        id: int,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        raw = await self._request(
            "DELETE",
            f"/internal/moderation/keywords/{id}",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return self._format_keyword(raw)

    async def get_keyword_forms(
        self,
        id: int,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        raw = await self._request(
            "GET",
            f"/internal/moderation/keywords/{id}/forms",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return {
            "keywordId": raw["keyword_id"],
            "word": raw["word"],
            "isPhrase": raw["is_phrase"],
            "generatedForms": raw["generated_forms"],
            "manualForms": raw["manual_forms"],
            "exclusions": raw["exclusions"],
        }

    async def add_manual_keyword_form(
        self,
        id: int,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        raw = await self._request(
            "POST",
            f"/internal/moderation/keywords/{id}/forms/manual",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json={"form": payload.get("form")},
        )
        return {
            "keywordId": raw["keyword_id"],
            "word": raw["word"],
            "isPhrase": raw["is_phrase"],
            "generatedForms": raw["generated_forms"],
            "manualForms": raw["manual_forms"],
            "exclusions": raw["exclusions"],
        }

    async def remove_manual_keyword_form(
        self,
        id: int,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        raw = await self._request(
            "DELETE",
            f"/internal/moderation/keywords/{id}/forms/manual",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json={"form": payload.get("form")},
        )
        return {
            "keywordId": raw["keyword_id"],
            "word": raw["word"],
            "isPhrase": raw["is_phrase"],
            "generatedForms": raw["generated_forms"],
            "manualForms": raw["manual_forms"],
            "exclusions": raw["exclusions"],
        }

    async def add_keyword_form_exclusion(
        self,
        id: int,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        raw = await self._request(
            "POST",
            f"/internal/moderation/keywords/{id}/forms/exclusions",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json={"form": payload.get("form")},
        )
        return {
            "keywordId": raw["keyword_id"],
            "word": raw["word"],
            "isPhrase": raw["is_phrase"],
            "generatedForms": raw["generated_forms"],
            "manualForms": raw["manual_forms"],
            "exclusions": raw["exclusions"],
        }

    async def remove_keyword_form_exclusion(
        self,
        id: int,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        raw = await self._request(
            "DELETE",
            f"/internal/moderation/keywords/{id}/forms/exclusions",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json={"form": payload.get("form")},
        )
        return {
            "keywordId": raw["keyword_id"],
            "word": raw["word"],
            "isPhrase": raw["is_phrase"],
            "generatedForms": raw["generated_forms"],
            "manualForms": raw["manual_forms"],
            "exclusions": raw["exclusions"],
        }

    async def recalculate_keyword_matches(
        self,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        raw = await self._request(
            "POST",
            "/internal/moderation/keywords/recalculate-matches",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return {
            "processed": raw.get("processed", 0),
            "updated": raw.get("updated", 0),
            "created": raw.get("created", 0),
            "deleted": raw.get("deleted", 0),
        }

    async def get_recalculation_job_status(
        self,
        id: int,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        raw = await self._request(
            "GET",
            f"/internal/moderation/keywords/recalculation-jobs/{id}",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return self._format_job(raw)

    async def rebuild_keyword_forms(
        self,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        raw = await self._request(
            "POST",
            "/internal/moderation/keywords/rebuild-forms",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return {
            "keywordsRebuilt": raw.get("keywords_rebuilt", 0),
            "processed": raw.get("processed", 0),
            "updated": raw.get("updated", 0),
            "created": raw.get("created", 0),
            "deleted": raw.get("deleted", 0),
        }


def get_keywords_gateway_service() -> KeywordsGatewayService:
    return KeywordsGatewayService()
