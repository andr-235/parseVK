from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.content.dependencies import get_group_service
from app.api.content.schemas import GroupSaveRequest, IntegerList
from app.services.content.groups import GroupService

router = APIRouter(prefix="/groups")
Service = Annotated[GroupService, Depends(get_group_service)]


@router.get("")
async def list_groups(
    service: Service,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = None,
    sort_by: str | None = Query(None, alias="sortBy"),
    sort_order: str = Query("desc", alias="sortOrder"),
):
    return await service.list_groups(page, limit, search, sort_by, sort_order)


@router.get("/search")
async def search_groups(service: Service, q: str = Query(min_length=1), limit: int = 20):
    return await service.search_groups(q, limit)


@router.post("/save")
async def save_group(payload: GroupSaveRequest, service: Service):
    return await service.save_group(payload.model_dump(exclude_none=True))


@router.post("/bulk")
async def bulk_groups(payload: IntegerList, service: Service):
    return await service.list_groups_bulk(payload.root)


@router.get("/{vk_group_id}")
async def get_group(vk_group_id: int, service: Service):
    group = await service.get_group(vk_group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.delete("/{vk_group_id}")
async def delete_group(vk_group_id: int, service: Service):
    if not await service.delete_group(vk_group_id):
        raise HTTPException(status_code=404, detail="Group not found")
    return {"deleted": True}
