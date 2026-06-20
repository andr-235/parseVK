from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.content.dependencies import get_post_service
from app.api.content.schemas import StringList
from app.services.content.posts import PostService

router = APIRouter()
Service = Annotated[PostService, Depends(get_post_service)]


@router.get("/posts")
async def list_posts(service: Service, page: int = Query(1, ge=1), limit: int = 20):
    return await service.list_posts(page, limit)


@router.get("/posts/{external_key}")
async def get_post(external_key: str, service: Service):
    post = await service.get_post(external_key)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get("/comments")
async def list_comments(service: Service, page: int = Query(1, ge=1), limit: int = 20):
    return await service.list_comments(page, limit)


@router.post("/posts/bulk")
async def bulk_posts(payload: StringList, service: Service):
    return await service.list_posts_bulk(payload.root)
