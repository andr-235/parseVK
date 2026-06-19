from __future__ import annotations

import logging
from typing import Annotated, Any

from app.core.utils import request_ids
from app.modules.content.service import (
    ContentGatewayService,
    VkGatewayService,
    get_content_gateway_service,
    get_vk_gateway_service,
)
from fastapi import APIRouter, Body, Depends, File, Request, UploadFile

logger = logging.getLogger(__name__)

groups_router = APIRouter()


@groups_router.post("/groups/save")
async def save_group(
    request: Request,
    payload: Annotated[dict[str, Any], Body()],
    vk_gateway_service: VkGatewayService = Depends(get_vk_gateway_service),
    content_gateway_service: ContentGatewayService = Depends(get_content_gateway_service),
):
    result = await vk_gateway_service.forward(
        request,
        "POST",
        "/internal/vk/groups/save",
        json=payload,
    )
    try:
        await content_gateway_service.forward(
            request,
            "POST",
            "/internal/content/groups/save",
            json=result,
        )
    except Exception:
        logger.exception("Failed to save group to content-service")
    return result


@groups_router.post("/groups/upload")
async def upload_groups(
    request: Request,
    file: UploadFile = File(...),
    vk_gateway_service: VkGatewayService = Depends(get_vk_gateway_service),
):
    content = await file.read()
    files = {"file": (file.filename, content, file.content_type)}
    return await vk_gateway_service.forward(
        request,
        "POST",
        "/internal/vk/groups/upload",
        files=files,
    )


@groups_router.delete("/groups/all")
async def delete_all_groups(
    request: Request,
    vk_gateway_service: VkGatewayService = Depends(get_vk_gateway_service),
):
    return await vk_gateway_service.forward(
        request,
        "DELETE",
        "/internal/vk/groups/all",
    )


@groups_router.delete("/groups/{vk_group_id}")
async def delete_group(
    vk_group_id: int,
    request: Request,
    vk_gateway_service: VkGatewayService = Depends(get_vk_gateway_service),
    content_gateway_service: ContentGatewayService = Depends(get_content_gateway_service),
):
    await vk_gateway_service.forward(request, "DELETE", f"/internal/vk/groups/{vk_group_id}")
    try:
        await content_gateway_service.forward(request, "DELETE", f"/internal/content/groups/{vk_group_id}")
    except Exception:
        logger.warning("Failed to delete group from content-service (non-critical)", exc_info=True)
    return {"status": "success"}


@groups_router.get("/groups/search/region")
async def search_region_groups(
    request: Request,
    query: str | None = None,
    vk_gateway_service: VkGatewayService = Depends(get_vk_gateway_service),
    content_gateway_service: ContentGatewayService = Depends(get_content_gateway_service),
):
    request_id, correlation_id = request_ids(request)
    return await content_gateway_service.search_region_groups(
        vk_gateway_service,
        query,
        request_id=request_id,
        correlation_id=correlation_id,
    )


@groups_router.get("/groups")
async def list_groups(
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(
        request,
        "GET",
        "/internal/content/groups",
        params=dict(request.query_params),
    )


@groups_router.get("/groups/search")
async def search_groups(
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(
        request,
        "GET",
        "/internal/content/groups/search",
        params=dict(request.query_params),
    )


@groups_router.get("/groups/{vk_group_id}")
async def get_group(
    vk_group_id: int,
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(request, "GET", f"/internal/content/groups/{vk_group_id}")
