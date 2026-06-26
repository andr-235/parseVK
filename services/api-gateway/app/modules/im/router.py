from __future__ import annotations

from typing import Annotated, Any

from app.modules.im.service import ImGatewayService, get_im_gateway_service
from fastapi import APIRouter, Body, Depends, Request

router = APIRouter(prefix="/api/v1/im", tags=["im"])


@router.get("/keywords")
async def list_keywords(
    request: Request,
    messenger: str | None = None,
    service: ImGatewayService = Depends(get_im_gateway_service),
):
    params = dict(request.query_params)
    return await service.forward_json(request, "GET", "/internal/keywords", params=params)


@router.post("/keywords", status_code=201)
async def add_keyword(
    request: Request,
    payload: Annotated[dict[str, Any], Body()],
    service: ImGatewayService = Depends(get_im_gateway_service),
):
    return await service.forward_json(request, "POST", "/internal/keywords", json=payload)


@router.delete("/keywords/{keyword_id}")
async def delete_keyword(
    keyword_id: int,
    request: Request,
    service: ImGatewayService = Depends(get_im_gateway_service),
):
    return await service.forward_json(request, "DELETE", f"/internal/keywords/{keyword_id}")


@router.get("/search/messages")
async def search_messages(
    request: Request,
    service: ImGatewayService = Depends(get_im_gateway_service),
):
    params = dict(request.query_params)
    return await service.forward_json(request, "GET", "/internal/search/messages", params=params)


@router.get("/search/by-keywords")
async def search_by_keywords(
    request: Request,
    service: ImGatewayService = Depends(get_im_gateway_service),
):
    params = dict(request.query_params)
    return await service.forward_json(request, "GET", "/internal/search/messages/by-keywords", params=params)


@router.get("/notifier/state")
async def get_notifier_state(
    request: Request,
    service: ImGatewayService = Depends(get_im_gateway_service),
):
    params = dict(request.query_params)
    return await service.forward_json(request, "GET", "/internal/notifier/state", params=params)


@router.put("/notifier/state")
async def update_notifier_state(
    request: Request,
    payload: Annotated[dict[str, Any], Body()],
    service: ImGatewayService = Depends(get_im_gateway_service),
):
    return await service.forward_json(request, "PUT", "/internal/notifier/state", json=payload)


@router.get("/notifier/new-messages")
async def get_new_messages(
    request: Request,
    service: ImGatewayService = Depends(get_im_gateway_service),
):
    params = dict(request.query_params)
    return await service.forward_json(request, "GET", "/internal/notifier/new-messages", params=params)
