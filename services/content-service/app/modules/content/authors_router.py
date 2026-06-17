from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import require_internal_token
from app.modules.content.dependencies import get_content_service
from app.modules.content.service import ContentService

router = APIRouter(
    prefix="/authors",
    tags=["authors"],
    dependencies=[Depends(require_internal_token)],
)


@router.get("")
async def list_authors(
    limit: int = Query(default=20, ge=1, le=100),
    page: int | None = Query(default=None, ge=1),
    offset: int | None = Query(default=None, ge=0),
    search: str | None = Query(default=None),
    city: str | None = Query(default=None),
    verified: str | None = Query(default=None),
    type: str | None = Query(default=None),
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
        author_type=type,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/{vk_author_id}")
async def get_author(
    vk_author_id: int,
    service: ContentService = Depends(get_content_service),
):
    row = await service.get_author(vk_author_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")
    return row


@router.post("/bulk")
async def list_authors_bulk(
    vk_author_ids: list[int],
    service: ContentService = Depends(get_content_service),
):
    return await service.list_authors_bulk(vk_author_ids)


@router.patch("/{vk_author_id}/verify")
async def verify_author(
    vk_author_id: int,
    service: ContentService = Depends(get_content_service),
):
    success = await service.verify_author(vk_author_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")
    return {"status": "success"}


@router.post("/refresh")
async def refresh_authors(
    service: ContentService = Depends(get_content_service),
):
    updated = await service.refresh_authors()
    return {"updated": updated}


@router.delete("/{vk_author_id}")
async def delete_author(
    vk_author_id: int,
    service: ContentService = Depends(get_content_service),
):
    success = await service.delete_author(vk_author_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")
    return {"deleted": True}
