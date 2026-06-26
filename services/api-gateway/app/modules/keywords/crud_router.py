from __future__ import annotations

from typing import Annotated

from app.core.security import require_auth
from app.core.utils import request_ids
from app.modules.keywords.service import KeywordsGatewayService, get_keywords_gateway_service
from fastapi import APIRouter, Body, Depends, File, Query, Request, UploadFile

crud_router = APIRouter()

PAGE_QUERY = Query(default=1, ge=1)
LIMIT_QUERY = Query(default=50, ge=1, le=1000)
SEARCH_QUERY = Query(default=None)
AUTH_DEPENDENCY = Depends(require_auth)
SERVICE_DEPENDENCY = Depends(get_keywords_gateway_service)


ENABLED_QUERY = Query(default=None)
SCOPE_QUERY = Query(default=None)


@crud_router.get("/")
async def get_keywords(
    request: Request,
    page: int = PAGE_QUERY,
    limit: int = LIMIT_QUERY,
    search: str | None = SEARCH_QUERY,
    enabled: bool | None = ENABLED_QUERY,
    scope: str | None = SCOPE_QUERY,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.get_all_keywords(
        page=page, limit=limit, search=search, enabled=enabled, scope=scope,
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@crud_router.post("/add")
async def add_keyword(
    request: Request,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.add_keyword(
        payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@crud_router.post("/bulk-add")
async def bulk_add_keywords(
    request: Request,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.bulk_add_keywords(
        payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@crud_router.post("/upload")
async def upload_keywords(
    request: Request,
    file: UploadFile = File(...),
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.upload_keywords(
        file,
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@crud_router.patch("/{id}")
async def update_keyword_category(
    request: Request,
    id: int,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.update_keyword_category(
        id, payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@crud_router.delete("/all")
async def delete_all_keywords(
    request: Request,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.delete_all_keywords(
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )


@crud_router.delete("/{id}")
async def delete_keyword(
    request: Request,
    id: int,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.delete_keyword(
        id,
        user_id=str(auth_claims["sub"]),
        request_id=request_id, correlation_id=correlation_id,
    )
