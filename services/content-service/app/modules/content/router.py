from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.content.repository import ContentRepository

router = APIRouter(
    prefix="/internal/content",
    tags=["content"],
    dependencies=[Depends(require_internal_token)],
)


async def get_content_repository(session: AsyncSession = Depends(get_session)) -> ContentRepository:
    return ContentRepository(session)


@router.get("/groups")
async def list_groups(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    repository: ContentRepository = Depends(get_content_repository),
):
    return await repository.list_groups(page, limit)


@router.get("/groups/{vk_group_id}")
async def get_group(vk_group_id: int, repository: ContentRepository = Depends(get_content_repository)):
    row = await repository.get_group(vk_group_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return row


@router.get("/posts")
async def list_posts(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    repository: ContentRepository = Depends(get_content_repository),
):
    return await repository.list_posts(page, limit)


@router.get("/posts/{external_key}")
async def get_post(external_key: str, repository: ContentRepository = Depends(get_content_repository)):
    row = await repository.get_post(external_key)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return row


@router.get("/comments")
async def list_comments(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    repository: ContentRepository = Depends(get_content_repository),
):
    return await repository.list_comments(page, limit)


@router.get("/authors")
async def list_authors(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    repository: ContentRepository = Depends(get_content_repository),
):
    return await repository.list_authors(page, limit)


@router.get("/authors/{vk_author_id}")
async def get_author(vk_author_id: int, repository: ContentRepository = Depends(get_content_repository)):
    row = await repository.get_author(vk_author_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")
    return row


@router.post("/authors/bulk")
async def list_authors_bulk(
    vk_author_ids: list[int],
    repository: ContentRepository = Depends(get_content_repository),
):
    return await repository.list_authors_bulk(vk_author_ids)


@router.post("/posts/bulk")
async def list_posts_bulk(
    external_keys: list[str],
    repository: ContentRepository = Depends(get_content_repository),
):
    return await repository.list_posts_bulk(external_keys)
