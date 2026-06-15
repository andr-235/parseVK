import logging
from collections.abc import Callable

logger = logging.getLogger("api-gateway.keywords.forms")


class KeywordFormsService:
    def __init__(self, request: Callable):
        self._request = request

    async def get_keyword_forms(
        self,
        id: int,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("KeywordFormsService.get_keyword_forms: id=%d", id)
        return await self._request(
            "GET", f"/internal/moderation/keywords/{id}/forms",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
        )

    async def add_manual_keyword_form(
        self,
        id: int,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("KeywordFormsService.add_manual_keyword_form: id=%d", id)
        return await self._request(
            "POST", f"/internal/moderation/keywords/{id}/forms/manual",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
            json=payload,
        )

    async def remove_manual_keyword_form(
        self,
        id: int,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("KeywordFormsService.remove_manual_keyword_form: id=%d", id)
        return await self._request(
            "DELETE", f"/internal/moderation/keywords/{id}/forms/manual",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
            json=payload,
        )

    async def add_keyword_form_exclusion(
        self,
        id: int,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("KeywordFormsService.add_keyword_form_exclusion: id=%d", id)
        return await self._request(
            "POST", f"/internal/moderation/keywords/{id}/forms/exclusions",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
            json=payload,
        )

    async def remove_keyword_form_exclusion(
        self,
        id: int,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        logger.debug("KeywordFormsService.remove_keyword_form_exclusion: id=%d", id)
        return await self._request(
            "DELETE", f"/internal/moderation/keywords/{id}/forms/exclusions",
            user_id=user_id, request_id=request_id, correlation_id=correlation_id,
            json=payload,
        )
