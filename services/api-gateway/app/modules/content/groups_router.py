import logging
from typing import Annotated, Any

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
    params = {}
    if query:
        params["query"] = query

    vk_groups = await vk_gateway_service.forward(
        request,
        "GET",
        "/internal/vk/groups/search/region",
        params=params,
    )

    if not vk_groups:
        return {"total": 0, "groups": [], "existsInDb": [], "missing": []}

    vk_ids = [group["id"] for group in vk_groups]
    try:
        existing = await content_gateway_service.forward(
            request,
            "POST",
            "/internal/content/groups/bulk",
            json=vk_ids,
        )
    except Exception:
        logger.warning("Failed to fetch existing groups from content service (non-critical)", exc_info=True)
        existing = []

    existing_ids = {group["vkId"] for group in existing}

    items = []
    for g in vk_groups:
        g_id = g.get("id")
        exists = g_id in existing_ids
        items.append({
            "id": g_id, "vkId": g_id, "vkGroupId": g_id,
            "name": g.get("name"), "screenName": g.get("screen_name"), "screen_name": g.get("screen_name"),
            "isClosed": g.get("is_closed"), "is_closed": g.get("is_closed"),
            "deactivated": g.get("deactivated"), "type": g.get("type"),
            "photo50": g.get("photo_50"), "photo_50": g.get("photo_50"),
            "photo100": g.get("photo_100"), "photo_100": g.get("photo_100"),
            "photo200": g.get("photo_200"), "photo_200": g.get("photo_200"),
            "activity": g.get("activity"), "ageLimits": g.get("age_limits"), "age_limits": g.get("age_limits"),
            "description": g.get("description"), "membersCount": g.get("members_count"), "members_count": g.get("members_count"),
            "status": g.get("status"), "verified": g.get("verified"),
            "wall": g.get("wall"), "addresses": g.get("addresses"),
            "city": g.get("city"), "counters": g.get("counters"),
            "existsInDb": exists,
        })

    exists_in_db = [item for item in items if item["existsInDb"]]
    missing = [item for item in items if not item["existsInDb"]]
    return {"total": len(items), "groups": items, "existsInDb": exists_in_db, "missing": missing}


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
