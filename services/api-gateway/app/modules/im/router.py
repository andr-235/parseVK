from __future__ import annotations

import logging
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, Request

from app.modules.im.service import (
    ImGatewayService,
    SearchGatewayService,
    get_im_gateway_service,
    get_search_gateway_service,
)

router = APIRouter(prefix="/api/v1/im", tags=["im"])


@router.get("/search/messages")
async def search_messages(
    request: Request,
    service: SearchGatewayService = Depends(get_search_gateway_service),
):
    logger = logging.getLogger(__name__)
    params = dict(request.query_params)
    logger.info("Search request routed to content-service: GET /internal/search/messages")
    logger.debug("Search params: %s", {k: v for k, v in params.items() if k != "q" or "(hidden)"})
    return await service.forward_json(request, "GET", "/internal/search/messages", params=params)


@router.post("/messages/search")
async def search_messages_post(
    request: Request,
    payload: Annotated[dict[str, Any], Body()],
    service: SearchGatewayService = Depends(get_search_gateway_service),
):
    logger = logging.getLogger(__name__)
    logger.info("Search request routed to content-service: POST /internal/search/messages/search")
    logger.debug("Search payload keys: %s", list(payload.keys()) if isinstance(payload, dict) else type(payload).__name__)
    return await service.forward_json(request, "POST", "/internal/search/messages/search", json=payload)


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


@router.get("/groups")
async def list_monitoring_groups(
    request: Request,
    service: ImGatewayService = Depends(get_im_gateway_service),
):
    params = dict(request.query_params)
    return await service.forward_json(request, "GET", "/internal/monitoring/groups", params=params)


@router.post("/groups", status_code=201)
async def create_monitoring_group(
    request: Request,
    payload: Annotated[dict[str, Any], Body()],
    service: ImGatewayService = Depends(get_im_gateway_service),
):
    return await service.forward_json(request, "POST", "/internal/monitoring/groups", json=payload)


@router.patch("/groups/{group_id}")
async def update_monitoring_group(
    group_id: int,
    request: Request,
    payload: Annotated[dict[str, Any], Body()],
    service: ImGatewayService = Depends(get_im_gateway_service),
):
    return await service.forward_json(request, "PATCH", f"/internal/monitoring/groups/{group_id}", json=payload)


@router.delete("/groups/{group_id}")
async def delete_monitoring_group(
    group_id: int,
    request: Request,
    service: ImGatewayService = Depends(get_im_gateway_service),
):
    return await service.forward_json(request, "DELETE", f"/internal/monitoring/groups/{group_id}")
