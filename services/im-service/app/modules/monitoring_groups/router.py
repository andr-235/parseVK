import logging

from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.core.security import require_internal_token, require_owner_user_id
from app.modules.monitoring_groups.dependencies import get_monitoring_groups_service
from app.modules.monitoring_groups.schemas import (
    MonitoringGroupCreateRequest,
    MonitoringGroupResponse,
    MonitoringGroupUpdateRequest,
)
from app.modules.monitoring_groups.service import MonitoringGroupsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/monitoring", tags=["monitoring_groups"])


@router.get("/groups")
async def list_groups(
    messenger: str | None = None,
    search: str | None = None,
    token: str = Depends(require_internal_token),
    service: MonitoringGroupsService = Depends(get_monitoring_groups_service),
) -> list[MonitoringGroupResponse]:
    rows = await service.list_groups(messenger, search)
    return [MonitoringGroupResponse.model_validate(r) for r in rows]


@router.post("/groups", status_code=201)
async def create_group(
    body: MonitoringGroupCreateRequest,
    user_id: str = Depends(require_owner_user_id),
    token: str = Depends(require_internal_token),
    service: MonitoringGroupsService = Depends(get_monitoring_groups_service),
) -> MonitoringGroupResponse:
    result = await service.create_group(body.messenger, body.chat_id, body.name, body.category)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Monitoring group already exists for this messenger and chat",
        )
    return MonitoringGroupResponse.model_validate(result)


@router.patch("/groups/{group_id}")
async def update_group(
    body: MonitoringGroupUpdateRequest,
    group_id: int = Path(...),
    user_id: str = Depends(require_owner_user_id),
    token: str = Depends(require_internal_token),
    service: MonitoringGroupsService = Depends(get_monitoring_groups_service),
) -> MonitoringGroupResponse:
    result = await service.update_group(group_id, body.name, body.category)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitoring group not found",
        )
    return MonitoringGroupResponse.model_validate(result)


@router.delete("/groups/{group_id}")
async def delete_group(
    group_id: int = Path(...),
    user_id: str = Depends(require_owner_user_id),
    token: str = Depends(require_internal_token),
    service: MonitoringGroupsService = Depends(get_monitoring_groups_service),
) -> dict:
    deleted = await service.delete_group(group_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitoring group not found",
        )
    return {"deleted": True}
