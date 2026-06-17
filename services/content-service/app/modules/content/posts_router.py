from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import require_internal_token
from app.modules.content.dependencies import get_content_service
from app.modules.content.service import ContentService

router = APIRouter(
    dependencies=[Depends(require_internal_token)],
)


@router.get("/posts")
async def list_posts(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    service: ContentService = Depends(get_content_service),
):
    return await service.list_posts(page, limit)


@router.get("/posts/{external_key}")
async def get_post(
    external_key: str,
    service: ContentService = Depends(get_content_service),
):
    row = await service.get_post(external_key)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return row


@router.get("/comments")
async def list_comments(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    service: ContentService = Depends(get_content_service),
):
    return await service.list_comments(page, limit)


@router.post("/posts/bulk")
async def list_posts_bulk(
    external_keys: list[str],
    service: ContentService = Depends(get_content_service),
):
    return await service.list_posts_bulk(external_keys)
