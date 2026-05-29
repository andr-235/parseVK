from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.content.photo_analysis import PhotoAnalysisClient
from app.modules.content.repository import ContentRepository
from app.modules.content.service import ContentService

router = APIRouter(
    prefix="/internal/content",
    tags=["content"],
    dependencies=[Depends(require_internal_token)],
)


async def get_content_service(session: AsyncSession = Depends(get_session)) -> ContentService:
    return ContentService(
        repo=ContentRepository(session),
        photo_analysis=PhotoAnalysisClient(),
    )


@router.get("/groups")
async def list_groups(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    search: str | None = Query(default=None),
    sort_by: str | None = Query(default=None, alias="sortBy"),
    sort_order: str = Query(default="desc", alias="sortOrder"),
    service: ContentService = Depends(get_content_service),
):
    return await service.list_groups(
        page=page,
        limit=limit,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/groups/search")
async def search_groups(
    q: str = Query(min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
    service: ContentService = Depends(get_content_service),
):
    return await service.search_groups(q, limit)


@router.get("/groups/{vk_group_id}")
async def get_group(
    vk_group_id: int,
    service: ContentService = Depends(get_content_service),
):
    row = await service.get_group(vk_group_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return row


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


@router.get("/authors")
async def list_authors(
    limit: int = Query(default=20, ge=1, le=100),
    page: int | None = Query(default=None, ge=1),
    offset: int | None = Query(default=None, ge=0),
    search: str | None = Query(default=None),
    city: str | None = Query(default=None),
    verified: str | None = Query(default=None),
    sort_by: str | None = Query(default=None, alias="sortBy"),
    sort_order: str = Query(default="desc", alias="sortOrder"),
    service: ContentService = Depends(get_content_service),
):
    return await service.list_authors(
        limit=limit,
        page=page,
        offset=offset,
        search=search,
        city=city,
        verified=verified,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/authors/{vk_author_id}")
async def get_author(
    vk_author_id: int,
    service: ContentService = Depends(get_content_service),
):
    row = await service.get_author(vk_author_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")
    return row


@router.post("/authors/bulk")
async def list_authors_bulk(
    vk_author_ids: list[int],
    service: ContentService = Depends(get_content_service),
):
    return await service.list_authors_bulk(vk_author_ids)


@router.patch("/authors/{vk_author_id}/verify")
async def verify_author(
    vk_author_id: int,
    service: ContentService = Depends(get_content_service),
):
    success = await service.verify_author(vk_author_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")
    return {"status": "success"}


@router.post("/posts/bulk")
async def list_posts_bulk(
    external_keys: list[str],
    service: ContentService = Depends(get_content_service),
):
    return await service.list_posts_bulk(external_keys)


@router.post("/groups/bulk")
async def list_groups_bulk(
    vk_group_ids: list[int],
    service: ContentService = Depends(get_content_service),
):
    return await service.list_groups_bulk(vk_group_ids)
