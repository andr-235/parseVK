from datetime import datetime
from typing import Annotated
<<<<<<< HEAD
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.modules.monitoring.service import MonitoringService
from app.modules.monitoring.schemas import (
    MonitoringGroupCreate,
    MonitoringGroupUpdate,
    MonitoringGroupsResponse,
    MonitoringGroupResponse,
    MonitorMessagesResponse,
)
=======

from app.modules.monitoring.dependencies import get_monitoring_service
from app.modules.monitoring.schemas import (
    MonitoringGroupCreate,
    MonitoringGroupResponse,
    MonitoringGroupsResponse,
    MonitoringGroupUpdate,
    MonitorMessagesResponse,
)
from app.modules.monitoring.service import MonitoringService
from fastapi import APIRouter, Depends, HTTPException, Query, status
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

router = APIRouter(prefix="/monitoring", tags=["monitoring"])



def parse_list_param(param: list[str] | None) -> list[str]:
    if not param:
        return []
    res = []
    seen = set()
    for val in param:
        for part in val.split(","):
            part_trimmed = part.strip()
            if part_trimmed and part_trimmed not in seen:
                seen.add(part_trimmed)
                res.append(part_trimmed)
    return res


@router.get("/messages", response_model=MonitorMessagesResponse)
async def get_messages(
    service: Annotated[MonitoringService, Depends(get_monitoring_service)],
    keywords: list[str] = Query(default=[]),
    limit: int = Query(default=100, ge=1),
    page: int = Query(default=1, ge=1),
    from_date: datetime | None = Query(default=None, alias="from"),
    sources: list[str] = Query(default=[]),
):
    try:
        # Для поддержки множественных параметров query (например ?keywords=A&keywords=B)
        # FastAPI автоматически собирает их в список.
        normalized_limit = min(max(limit, 1), 500)
        parsed_keywords = parse_list_param(keywords)
        parsed_sources = parse_list_param(sources)
        return await service.get_messages(
            keywords=parsed_keywords,
            limit=normalized_limit,
            page=page,
            from_date=from_date,
            sources=parsed_sources,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Не удалось загрузить сообщения мониторинга: {exc}"
<<<<<<< HEAD
        )
=======
        ) from exc
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


@router.get("/groups", response_model=MonitoringGroupsResponse)
async def get_groups(
    service: Annotated[MonitoringService, Depends(get_monitoring_service)],
    messenger: str | None = Query(default=None),
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    sync: bool = Query(default=False),
):
    try:
        return await service.get_groups(
            messenger=messenger,
            search=search,
            category=category,
            sync=sync,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Не удалось загрузить группы мониторинга: {exc}"
<<<<<<< HEAD
        )
=======
        ) from exc
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


@router.post("/groups", response_model=MonitoringGroupResponse)
async def create_group(
    dto: MonitoringGroupCreate,
    service: Annotated[MonitoringService, Depends(get_monitoring_service)],
):
    try:
        return await service.create_group(dto)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Не удалось сохранить группу: {exc}"
<<<<<<< HEAD
        )
=======
        ) from exc
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


@router.patch("/groups/{id}", response_model=MonitoringGroupResponse)
async def update_group(
    id: int,
    dto: MonitoringGroupUpdate,
    service: Annotated[MonitoringService, Depends(get_monitoring_service)],
):
    try:
        return await service.update_group(id, dto)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Не удалось обновить группу: {exc}"
<<<<<<< HEAD
        )
=======
        ) from exc
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


@router.delete("/groups/{id}")
async def delete_group(
    id: int,
    service: Annotated[MonitoringService, Depends(get_monitoring_service)],
):
    try:
        return await service.delete_group(id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Не удалось удалить группу: {exc}"
<<<<<<< HEAD
        )
=======
        ) from exc
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
