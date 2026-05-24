import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.content.photo_analysis import PhotoAnalysisClient
from app.modules.content.repository import ContentRepository

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/internal/content",
    tags=["content"],
    dependencies=[Depends(require_internal_token)],
)


async def get_content_repository(session: AsyncSession = Depends(get_session)) -> ContentRepository:
    return ContentRepository(session)


async def get_photo_analysis_client() -> PhotoAnalysisClient:
    return PhotoAnalysisClient()


@router.get("/groups")
async def list_groups(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    search: str | None = Query(default=None),
    sort_by: str | None = Query(default=None, alias="sortBy"),
    sort_order: str = Query(default="desc", alias="sortOrder"),
    repository: ContentRepository = Depends(get_content_repository),
):
    return await repository.list_groups(
        page=page,
        limit=limit,
        search=normalize_text(search),
        sort_by=sort_by,
        sort_order=normalize_sort_order(sort_order),
    )


@router.get("/groups/search")
async def search_groups(
    q: str = Query(min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
    repository: ContentRepository = Depends(get_content_repository),
):
    return await repository.search_groups(normalize_text(q) or q, limit)


@router.get("/groups/{vk_group_id}")
async def get_group(
    vk_group_id: int,
    repository: ContentRepository = Depends(get_content_repository),
):
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
async def get_post(
    external_key: str,
    repository: ContentRepository = Depends(get_content_repository),
):
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
    limit: int = Query(default=20, ge=1, le=100),
    page: int | None = Query(default=None, ge=1),
    offset: int | None = Query(default=None, ge=0),
    search: str | None = Query(default=None),
    city: str | None = Query(default=None),
    verified: str | None = Query(default=None),
    sort_by: str | None = Query(default=None, alias="sortBy"),
    sort_order: str = Query(default="desc", alias="sortOrder"),
    repository: ContentRepository = Depends(get_content_repository),
    photo_analysis_client: PhotoAnalysisClient = Depends(get_photo_analysis_client),
):
    resolved_offset = offset if offset is not None else ((page or 1) - 1) * limit
    payload = await repository.list_authors(
        offset=resolved_offset,
        limit=limit,
        search=normalize_text(search),
        city=normalize_text(city),
        verified=parse_optional_bool(verified),
        sort_by=sort_by,
        sort_order=normalize_sort_order(sort_order),
    )
    await enrich_author_summaries(payload["items"], photo_analysis_client)
    return payload


@router.get("/authors/{vk_author_id}")
async def get_author(
    vk_author_id: int,
    repository: ContentRepository = Depends(get_content_repository),
    photo_analysis_client: PhotoAnalysisClient = Depends(get_photo_analysis_client),
):
    row = await repository.get_author(vk_author_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")
    await enrich_author_summaries([row], photo_analysis_client)
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


def normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def normalize_sort_order(value: str | None) -> str:
    return value if value in {"asc", "desc"} else "desc"


def parse_optional_bool(value: Any) -> bool | None:
    if value in {None, "", "all"}:
        return None
    if value in {True, "true", "1"}:
        return True
    if value in {False, "false", "0"}:
        return False
    return None


async def enrich_author_summaries(
    items: list[dict],
    photo_analysis_client: PhotoAnalysisClient,
) -> None:
    vk_author_ids = [
        int(item["vkUserId"])
        for item in items
        if item.get("vkUserId") is not None
    ]
    if not vk_author_ids:
        return

    try:
        summaries = await photo_analysis_client.summaries_by_vk_author_ids(vk_author_ids)
    except Exception as exc:
        logger.warning("Photo analysis enrichment failed: %s", exc)
        return

    for item in items:
        summary = summaries.get(int(item["vkUserId"]))
        if summary is not None:
            item["summary"] = summary
            item["photosCount"] = summary.get("total", item.get("photosCount"))
