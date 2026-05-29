from typing import Annotated, Any
from app.modules.content.service import (
    ContentGatewayService,
    get_content_gateway_service,
    VkGatewayService,
    get_vk_gateway_service,
)
from fastapi import APIRouter, Depends, Request, Body

router = APIRouter(prefix="/api/v1/content", tags=["content"])


@router.post("/groups/save")
async def save_group(
    request: Request,
    payload: Annotated[dict[str, Any], Body()],
    vk_gateway_service: VkGatewayService = Depends(get_vk_gateway_service),
):
    return await vk_gateway_service.forward(
        request,
        "POST",
        "/internal/vk/groups/save",
        json=payload,
    )


@router.get("/groups")
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


@router.get("/groups/search")
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


@router.get("/groups/{vk_group_id}")
async def get_group(
    vk_group_id: int,
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(request, "GET", f"/internal/content/groups/{vk_group_id}")


@router.get("/posts")
async def list_posts(
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(
        request,
        "GET",
        "/internal/content/posts",
        params=dict(request.query_params),
    )


@router.get("/posts/{external_key}")
async def get_post(
    external_key: str,
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(request, "GET", f"/internal/content/posts/{external_key}")


@router.get("/comments")
async def list_comments(
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(
        request,
        "GET",
        "/internal/content/comments",
        params=dict(request.query_params),
    )


@router.get("/authors")
async def list_authors(
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(
        request,
        "GET",
        "/internal/content/authors",
        params=dict(request.query_params),
    )


@router.get("/authors/{vk_author_id}")
async def get_author(
    vk_author_id: int,
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(request, "GET", f"/internal/content/authors/{vk_author_id}")
