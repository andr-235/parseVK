import httpx
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings


class KeywordsGatewayService:
    def __init__(self):
        self.moderation_url = settings.moderation_base_url
        self.headers = {"X-Internal-Service-Token": settings.internal_service_token}

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self.moderation_url}{path}"
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.request(method, url, headers=self.headers, **kwargs)
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                try:
                    detail = e.response.json().get("detail", str(e))
                except Exception:
                    detail = e.response.text or str(e)
                raise HTTPException(status_code=e.response.status_code, detail=detail)
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Moderation service unavailable: {str(e)}"
                )

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

    async def get_all_keywords(self, page: int, limit: int, search: str | None = None) -> dict:
        params = {"page": page, "limit": limit}
        if search:
            params["search"] = search

        raw = await self._request("GET", "/internal/moderation/keywords", params=params)
        return {
            "keywords": [self._format_keyword(kw) for kw in raw["keywords"]],
            "total": raw["total"],
            "page": raw["page"],
            "limit": raw["limit"],
        }

    async def add_keyword(self, payload: dict) -> dict:
        # Адаптация camelCase фронтенда к snake_case бэкенда
        body = {
            "word": payload.get("word"),
            "category": payload.get("category"),
            "is_phrase": payload.get("isPhrase", False),
        }
        raw = await self._request("POST", "/internal/moderation/keywords/add", json=body)
        return self._format_keyword(raw)

    async def bulk_add_keywords(self, payload: dict) -> dict:
        raw = await self._request(
            "POST",
            "/internal/moderation/keywords/bulk-add",
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

    async def upload_keywords(self, file: UploadFile) -> dict:
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
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File encoding must be UTF-8",
            )

        raw = await self._request(
            "POST",
            "/internal/moderation/keywords/upload-content",
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

    async def update_keyword_category(self, id: int, payload: dict) -> dict:
        raw = await self._request(
            "PATCH",
            f"/internal/moderation/keywords/{id}",
            json={"category": payload.get("category")},
        )
        return self._format_keyword(raw)

    async def delete_all_keywords(self) -> dict:
        raw = await self._request("DELETE", "/internal/moderation/keywords/all")
        # Мапим count для фронтенда IDeleteResponse
        return {"count": raw.get("count", 0)}

    async def delete_keyword(self, id: int) -> dict:
        raw = await self._request("DELETE", f"/internal/moderation/keywords/{id}")
        return self._format_keyword(raw)

    async def get_keyword_forms(self, id: int) -> dict:
        raw = await self._request("GET", f"/internal/moderation/keywords/{id}/forms")
        return {
            "keywordId": raw["keyword_id"],
            "word": raw["word"],
            "isPhrase": raw["is_phrase"],
            "generatedForms": raw["generated_forms"],
            "manualForms": raw["manual_forms"],
            "exclusions": raw["exclusions"],
        }

    async def add_manual_keyword_form(self, id: int, payload: dict) -> dict:
        raw = await self._request(
            "POST",
            f"/internal/moderation/keywords/{id}/forms/manual",
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

    async def remove_manual_keyword_form(self, id: int, payload: dict) -> dict:
        raw = await self._request(
            "DELETE",
            f"/internal/moderation/keywords/{id}/forms/manual",
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

    async def add_keyword_form_exclusion(self, id: int, payload: dict) -> dict:
        raw = await self._request(
            "POST",
            f"/internal/moderation/keywords/{id}/forms/exclusions",
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

    async def remove_keyword_form_exclusion(self, id: int, payload: dict) -> dict:
        raw = await self._request(
            "DELETE",
            f"/internal/moderation/keywords/{id}/forms/exclusions",
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

    async def recalculate_keyword_matches(self) -> dict:
        raw = await self._request("POST", "/internal/moderation/keywords/recalculate-matches")
        return {
            "processed": raw.get("processed", 0),
            "updated": raw.get("updated", 0),
            "created": raw.get("created", 0),
            "deleted": raw.get("deleted", 0),
        }

    async def get_recalculation_job_status(self, id: int) -> dict:
        raw = await self._request("GET", f"/internal/moderation/keywords/recalculation-jobs/{id}")
        return self._format_job(raw)

    async def rebuild_keyword_forms(self) -> dict:
        raw = await self._request("POST", "/internal/moderation/keywords/rebuild-forms")
        return {
            "keywordsRebuilt": raw.get("keywords_rebuilt", 0),
            "processed": raw.get("processed", 0),
            "updated": raw.get("updated", 0),
            "created": raw.get("created", 0),
            "deleted": raw.get("deleted", 0),
        }


def get_keywords_gateway_service() -> KeywordsGatewayService:
    return KeywordsGatewayService()
