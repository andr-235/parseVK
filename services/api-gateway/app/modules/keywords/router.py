from typing import Annotated

from app.core.security import require_auth
from app.modules.auth.router import request_ids
from app.modules.keywords.service import KeywordsGatewayService, get_keywords_gateway_service
from fastapi import APIRouter, Body, Depends, File, Query, Request, UploadFile

router = APIRouter(prefix="/api/v1/keywords", tags=["keywords"])

PAGE_QUERY = Query(default=1, ge=1)
LIMIT_QUERY = Query(default=50, ge=1, le=100)
SEARCH_QUERY = Query(default=None)
UPLOAD_FILE = File(...)
AUTH_DEPENDENCY = Depends(require_auth)
SERVICE_DEPENDENCY = Depends(get_keywords_gateway_service)


@router.get("")
async def get_keywords(
    request: Request,
    page: int = PAGE_QUERY,
    limit: int = LIMIT_QUERY,
    search: str | None = SEARCH_QUERY,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.get_all_keywords(
        page=page,
        limit=limit,
        search=search,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.post("/add")
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
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.post("/bulk-add")
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
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.post("/upload")
async def upload_keywords(
    request: Request,
    file: UploadFile = UPLOAD_FILE,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.upload_keywords(
        file,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.patch("/{id}")
async def update_keyword_category(
    request: Request,
    id: int,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.update_keyword_category(
        id,
        payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.delete("/all")
async def delete_all_keywords(
    request: Request,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.delete_all_keywords(
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.delete("/{id}")
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
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.get("/{id}/forms")
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
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.post("/{id}/forms/manual")
async def add_manual_keyword_form(
    request: Request,
    id: int,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.add_manual_keyword_form(
        id,
        payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.delete("/{id}/forms/manual")
async def remove_manual_keyword_form(
    request: Request,
    id: int,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.remove_manual_keyword_form(
        id,
        payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.post("/{id}/forms/exclusions")
async def add_keyword_form_exclusion(
    request: Request,
    id: int,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.add_keyword_form_exclusion(
        id,
        payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.delete("/{id}/forms/exclusions")
async def remove_keyword_form_exclusion(
    request: Request,
    id: int,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.remove_keyword_form_exclusion(
        id,
        payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.post("/recalculate-matches")
async def recalculate_keyword_matches(
    request: Request,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.recalculate_keyword_matches(
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.get("/recalculation-jobs/{id}")
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
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.post("/rebuild-forms")
async def rebuild_keyword_forms(
    request: Request,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: KeywordsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.rebuild_keyword_forms(
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )
