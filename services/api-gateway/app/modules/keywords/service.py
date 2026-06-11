from typing import Any

from app.clients.moderation.client import (
    ModerationClient,
    ModerationClientHTTPError,
    ModerationClientUnavailableError,
)
from fastapi import HTTPException, UploadFile, status

from app.modules.keywords.keyword_crud import KeywordCrudService
from app.modules.keywords.keyword_forms import KeywordFormsService


class KeywordsGatewayService:
    def __init__(self, moderation_client: ModerationClient | None = None):
        svc = self
        self.moderation_client = moderation_client or ModerationClient()
        self.moderation_url = self.moderation_client.base_url

        _request = lambda m, p, **kw: svc._request(m, p, **kw)
        _fmt_kw = lambda kw: svc._format_keyword(kw)

        self._crud = KeywordCrudService(request=_request, format_keyword=_fmt_kw)
        self._forms = KeywordFormsService(request=_request)

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
                method, path,
                user_id=user_id, request_id=request_id, correlation_id=correlation_id,
                params=params, json=json,
            )
        except ModerationClientHTTPError as exc:
            detail = (
                exc.detail.get("detail", exc.detail)
                if isinstance(exc.detail, dict)
                else exc.detail
            )
            raise HTTPException(status_code=exc.status_code, detail=detail) from exc
        except ModerationClientUnavailableError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Moderation service unavailable",
            )

    def _format_keyword(self, kw: dict) -> dict:
        return {
            "id": kw["id"], "word": kw["word"], "category": kw.get("category"),
            "isPhrase": kw.get("is_phrase", False),
            "createdAt": kw.get("created_at"), "updatedAt": kw.get("updated_at"),
        }

    def _format_job(self, job: dict) -> dict:
        return {
            "id": job["id"], "status": job["status"],
            "singleKeywordId": job.get("single_keyword_id"),
            "startedAt": job.get("started_at"), "finishedAt": job.get("finished_at"),
            "error": job.get("error"), "requestedBy": job.get("requested_by"),
            "createdAt": job.get("created_at"),
        }

    async def get_all_keywords(self, page: int, limit: int, search: str | None = None, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._crud.get_all_keywords(page, limit, search, user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def add_keyword(self, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._crud.add_keyword(payload, user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def bulk_add_keywords(self, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._crud.bulk_add_keywords(payload, user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def upload_keywords(self, file: UploadFile, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._crud.upload_keywords(file, user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def update_keyword_category(self, id: int, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._crud.update_keyword_category(id, payload, user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def delete_all_keywords(self, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._crud.delete_all_keywords(user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def delete_keyword(self, id: int, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._crud.delete_keyword(id, user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def get_keyword_forms(self, id: int, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._forms.get_keyword_forms(id, user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def add_manual_keyword_form(self, id: int, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._forms.add_manual_keyword_form(id, payload, user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def remove_manual_keyword_form(self, id: int, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._forms.remove_manual_keyword_form(id, payload, user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def add_keyword_form_exclusion(self, id: int, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._forms.add_keyword_form_exclusion(id, payload, user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def remove_keyword_form_exclusion(self, id: int, payload: dict, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        return await self._forms.remove_keyword_form_exclusion(id, payload, user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def recalculate_keyword_matches(self, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        raw = await self._request(
            "POST", "/internal/moderation/keywords/recalculate-matches",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
        )
        return {"processed": raw.get("processed", 0), "updated": raw.get("updated", 0), "created": raw.get("created", 0), "deleted": raw.get("deleted", 0)}

    async def get_recalculation_job_status(self, id: int, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        raw = await self._request(
            "GET", f"/internal/moderation/keywords/recalculation-jobs/{id}",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
        )
        return self._format_job(raw)

    async def rebuild_keyword_forms(self, *, user_id: str | None = None, request_id: str | None = None, correlation_id: str | None = None) -> dict:
        raw = await self._request(
            "POST", "/internal/moderation/keywords/rebuild-forms",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
        )
        return {"keywordsRebuilt": raw.get("keywords_rebuilt", 0), "processed": raw.get("processed", 0), "updated": raw.get("updated", 0), "created": raw.get("created", 0), "deleted": raw.get("deleted", 0)}


def get_keywords_gateway_service() -> KeywordsGatewayService:
    return KeywordsGatewayService()
