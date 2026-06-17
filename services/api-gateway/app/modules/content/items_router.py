from app.modules.content.service import (
    ContentGatewayService,
    get_content_gateway_service,
)
from fastapi import APIRouter, Depends, Request

items_router = APIRouter()


@items_router.get("/posts")
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


@items_router.get("/posts/{external_key}")
async def get_post(
    external_key: str,
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(request, "GET", f"/internal/content/posts/{external_key}")


@items_router.get("/comments")
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


@items_router.get("/authors")
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


@items_router.get("/authors/{vk_author_id}")
async def get_author(
    vk_author_id: int,
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(request, "GET", f"/internal/content/authors/{vk_author_id}")


@items_router.post("/authors/refresh")
async def refresh_authors(
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(request, "POST", "/internal/content/authors/refresh")


@items_router.delete("/authors/{vk_author_id}")
async def delete_author(
    vk_author_id: int,
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(request, "DELETE", f"/internal/content/authors/{vk_author_id}")


@items_router.patch("/authors/{vk_author_id}/verify")
async def verify_author(
    vk_author_id: int,
    request: Request,
    service: ContentGatewayService = Depends(get_content_gateway_service),
):
    return await service.forward(request, "PATCH", f"/internal/content/authors/{vk_author_id}/verify")
