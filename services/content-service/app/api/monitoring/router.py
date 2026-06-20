from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.monitoring.dependencies import (
    get_monitoring_groups,
    get_monitoring_messages,
)
from app.api.monitoring.schemas import (
    MonitoringGroupCreate,
    MonitoringGroupResponse,
    MonitoringGroupsResponse,
    MonitoringGroupUpdate,
    MonitorMessagesResponse,
)
from app.domain.content.errors import EntityNotFoundError
from app.services.monitoring.groups import MonitoringGroupService
from app.services.monitoring.messages import MonitoringMessageService

router = APIRouter(prefix="/monitoring", tags=["monitoring"])
Groups = Annotated[MonitoringGroupService, Depends(get_monitoring_groups)]
Messages = Annotated[MonitoringMessageService, Depends(get_monitoring_messages)]


def parse_list_param(values: list[str] | None) -> list[str]:
    result = []
    for value in values or []:
        for part in value.split(","):
            normalized = part.strip()
            if normalized and normalized not in result:
                result.append(normalized)
    return result


@router.get("/messages", response_model=MonitorMessagesResponse)
async def get_messages(
    service: Messages,
    keywords: list[str] = Query(default=[]),
    limit: int = Query(100, ge=1, le=500),
    page: int = Query(1, ge=1),
    from_date: datetime | None = Query(None, alias="from"),
    sources: list[str] = Query(default=[]),
):
    return await service.list_messages(
        keywords=parse_list_param(keywords),
        limit=limit,
        page=page,
        from_date=from_date,
        sources=parse_list_param(sources),
    )


@router.get("/groups", response_model=MonitoringGroupsResponse)
async def get_groups(
    service: Groups,
    messenger: str | None = None,
    search: str | None = None,
    category: str | None = None,
    sync: bool = False,
):
    return await service.list_groups(
        messenger=messenger,
        search=search,
        category=category,
        sync=sync,
    )


@router.post("/groups", response_model=MonitoringGroupResponse)
async def create_group(payload: MonitoringGroupCreate, service: Groups):
    return await service.create_group(payload.model_dump(by_alias=False))


@router.patch("/groups/{group_id}", response_model=MonitoringGroupResponse)
async def update_group(
    group_id: int,
    payload: MonitoringGroupUpdate,
    service: Groups,
):
    try:
        return await service.update_group(
            group_id,
            payload.model_dump(exclude_unset=True, by_alias=False),
        )
    except EntityNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.delete("/groups/{group_id}")
async def delete_group(group_id: int, service: Groups):
    try:
        return await service.delete_group(group_id)
    except EntityNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
