from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import require_internal_token
from app.modules.content.dependencies import get_content_service
from app.modules.content.service import ContentService

router = APIRouter(
    prefix="/groups",
    tags=["groups"],
    dependencies=[Depends(require_internal_token)],
)


@router.get("")
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


@router.get("/search")
async def search_groups(
    q: str = Query(min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
    service: ContentService = Depends(get_content_service),
):
    return await service.search_groups(q, limit)


@router.post("/save")
async def save_group(
    payload: dict,
    service: ContentService = Depends(get_content_service),
):
    return await service.save_group(payload)


@router.get("/{vk_group_id}")
async def get_group(
    vk_group_id: int,
    service: ContentService = Depends(get_content_service),
):
    row = await service.get_group(vk_group_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return row


@router.delete("/{vk_group_id}")
async def delete_group(
    vk_group_id: int,
    service: ContentService = Depends(get_content_service),
):
    success = await service.delete_group(vk_group_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return {"deleted": True}


@router.post("/bulk")
async def list_groups_bulk(
    vk_group_ids: list[int],
    service: ContentService = Depends(get_content_service),
):
    return await service.list_groups_bulk(vk_group_ids)
