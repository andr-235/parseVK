from __future__ import annotations

from typing import Annotated

from app.core.security import require_auth
from app.core.utils import request_ids
from app.modules.keywords.service import KeywordsGatewayService, get_keywords_gateway_service
from fastapi import APIRouter, Body, Depends, Request

forms_router = APIRouter()

AUTH_DEPENDENCY = Depends(require_auth)
SERVICE_DEPENDENCY = Depends(get_keywords_gateway_service)


@forms_router.get("/{id}/forms")
async def get_keyword_forms(
    request: Request,
    id: int,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.get_keyword_forms(
        id,
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@forms_router.post("/{id}/forms/manual")
async def add_manual_keyword_form(
    request: Request,
    id: int,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.add_manual_keyword_form(
        id, payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@forms_router.delete("/{id}/forms/manual")
async def remove_manual_keyword_form(
    request: Request,
    id: int,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.remove_manual_keyword_form(
        id, payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@forms_router.post("/{id}/forms/exclusions")
async def add_keyword_form_exclusion(
    request: Request,
    id: int,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.add_keyword_form_exclusion(
        id, payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@forms_router.delete("/{id}/forms/exclusions")
async def remove_keyword_form_exclusion(
    request: Request,
    id: int,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.remove_keyword_form_exclusion(
        id, payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@forms_router.post("/recalculate-matches")
async def recalculate_keyword_matches(
    request: Request,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.recalculate_keyword_matches(
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@forms_router.get("/recalculation-jobs/{id}")
async def get_recalculation_job_status(
    request: Request,
    id: int,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.get_recalculation_job_status(
        id,
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@forms_router.post("/rebuild-forms")
async def rebuild_keyword_forms(
    request: Request,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.rebuild_keyword_forms(
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )
