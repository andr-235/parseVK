import httpx
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings


class KeywordsGatewayService:
    def __init__(self):
        self.moderation_url = settings.moderation_base_url
        self.headers = {"X-Internal-Service-Token": settings.internal_service_token}

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

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.moderation_url}/internal/moderation/keywords",
                params=params,
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

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

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.moderation_url}/internal/moderation/keywords/add",
                json=body,
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

        return self._format_keyword(raw)

    async def bulk_add_keywords(self, payload: dict) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.moderation_url}/internal/moderation/keywords/bulk-add",
                json={"words": payload.get("words", [])},
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

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

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.moderation_url}/internal/moderation/keywords/upload-content",
                json={"content": content_str},
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

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
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{self.moderation_url}/internal/moderation/keywords/{id}",
                json={"category": payload.get("category")},
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

        return self._format_keyword(raw)

    async def delete_all_keywords(self) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.delete(
                f"{self.moderation_url}/internal/moderation/keywords/all",
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

        # Мапим count для фронтенда IDeleteResponse
        return {"count": raw.get("count", 0)}

    async def delete_keyword(self, id: int) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.delete(
                f"{self.moderation_url}/internal/moderation/keywords/{id}",
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

        # Возвращаем удаленный KeywordResponse для полной совместимости
        return {"id": id, "success": True}

    async def get_keyword_forms(self, id: int) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.moderation_url}/internal/moderation/keywords/{id}/forms",
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

        return {
            "keywordId": raw["keyword_id"],
            "word": raw["word"],
            "isPhrase": raw["is_phrase"],
            "generatedForms": raw["generated_forms"],
            "manualForms": raw["manual_forms"],
            "exclusions": raw["exclusions"],
        }

    async def add_manual_keyword_form(self, id: int, payload: dict) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.moderation_url}/internal/moderation/keywords/{id}/forms/manual",
                json={"form": payload.get("form")},
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

        return {
            "keywordId": raw["keyword_id"],
            "word": raw["word"],
            "isPhrase": raw["is_phrase"],
            "generatedForms": raw["generated_forms"],
            "manualForms": raw["manual_forms"],
            "exclusions": raw["exclusions"],
        }

    async def remove_manual_keyword_form(self, id: int, payload: dict) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.request(
                "DELETE",
                f"{self.moderation_url}/internal/moderation/keywords/{id}/forms/manual",
                json={"form": payload.get("form")},
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

        return {
            "keywordId": raw["keyword_id"],
            "word": raw["word"],
            "isPhrase": raw["is_phrase"],
            "generatedForms": raw["generated_forms"],
            "manualForms": raw["manual_forms"],
            "exclusions": raw["exclusions"],
        }

    async def add_keyword_form_exclusion(self, id: int, payload: dict) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.moderation_url}/internal/moderation/keywords/{id}/forms/exclusions",
                json={"form": payload.get("form")},
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

        return {
            "keywordId": raw["keyword_id"],
            "word": raw["word"],
            "isPhrase": raw["is_phrase"],
            "generatedForms": raw["generated_forms"],
            "manualForms": raw["manual_forms"],
            "exclusions": raw["exclusions"],
        }

    async def remove_keyword_form_exclusion(self, id: int, payload: dict) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.request(
                "DELETE",
                f"{self.moderation_url}/internal/moderation/keywords/{id}/forms/exclusions",
                json={"form": payload.get("form")},
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

        return {
            "keywordId": raw["keyword_id"],
            "word": raw["word"],
            "isPhrase": raw["is_phrase"],
            "generatedForms": raw["generated_forms"],
            "manualForms": raw["manual_forms"],
            "exclusions": raw["exclusions"],
        }

    async def recalculate_keyword_matches(self) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.moderation_url}/internal/moderation/keywords/recalculate-matches",
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

        # Возвращаем заглушку IKeywordFormsRebuildResponse для совместимости с фронтом
        return {
            "processed": 0,
            "updated": 0,
            "created": 0,
            "deleted": 0,
        }

    async def rebuild_keyword_forms(self) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.moderation_url}/internal/moderation/keywords/rebuild-forms",
                headers=self.headers,
            )
            resp.raise_for_status()
            raw = resp.json()

        return {
            "keywordsRebuilt": raw.get("keywords_rebuilt", 0),
            "processed": raw.get("processed", 0),
            "updated": raw.get("updated", 0),
            "created": raw.get("created", 0),
            "deleted": raw.get("deleted", 0),
        }


def get_keywords_gateway_service() -> KeywordsGatewayService:
    return KeywordsGatewayService()
