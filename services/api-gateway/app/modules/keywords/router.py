from typing import Annotated

from fastapi import APIRouter, Body, Depends, Query, File, UploadFile

from app.core.security import require_auth
from app.modules.keywords.service import KeywordsGatewayService, get_keywords_gateway_service

router = APIRouter(prefix="/api/v1/keywords", tags=["keywords"], dependencies=[Depends(require_auth)])


@router.get("")
async def get_keywords(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    search: str | None = Query(default=None),
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.get_all_keywords(page=page, limit=limit, search=search)


@router.post("/add")
async def add_keyword(
    payload: Annotated[dict, Body()],
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.add_keyword(payload)


@router.post("/bulk-add")
async def bulk_add_keywords(
    payload: Annotated[dict, Body()],
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.bulk_add_keywords(payload)


@router.post("/upload")
async def upload_keywords(
    file: UploadFile = File(...),
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.upload_keywords(file)


@router.patch("/{id}")
async def update_keyword_category(
    id: int,
    payload: Annotated[dict, Body()],
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.update_keyword_category(id, payload)


@router.delete("/all")
async def delete_all_keywords(
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.delete_all_keywords()


@router.delete("/{id}")
async def delete_keyword(
    id: int,
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.delete_keyword(id)


@router.get("/{id}/forms")
async def get_keyword_forms(
    id: int,
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.get_keyword_forms(id)


@router.post("/{id}/forms/manual")
async def add_manual_keyword_form(
    id: int,
    payload: Annotated[dict, Body()],
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.add_manual_keyword_form(id, payload)


@router.delete("/{id}/forms/manual")
async def remove_manual_keyword_form(
    id: int,
    payload: Annotated[dict, Body()],
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.remove_manual_keyword_form(id, payload)


@router.post("/{id}/forms/exclusions")
async def add_keyword_form_exclusion(
    id: int,
    payload: Annotated[dict, Body()],
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.add_keyword_form_exclusion(id, payload)


@router.delete("/{id}/forms/exclusions")
async def remove_keyword_form_exclusion(
    id: int,
    payload: Annotated[dict, Body()],
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.remove_keyword_form_exclusion(id, payload)


@router.post("/recalculate-matches")
async def recalculate_keyword_matches(
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.recalculate_keyword_matches()


@router.post("/rebuild-forms")
async def rebuild_keyword_forms(
    service: KeywordsGatewayService = Depends(get_keywords_gateway_service),
):
    return await service.rebuild_keyword_forms()
