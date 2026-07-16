from typing import Annotated

from fastapi import APIRouter, Depends, Header

from app.api.dependencies import get_automation_service
from app.core.security import require_internal_token, require_owner_user_id
from app.modules.automation.schemas import AutomationSettingsUpdate
from app.modules.automation.service import AutomationService

router = APIRouter(
    prefix="/internal/tasks/automation",
    tags=["task-automation"],
    dependencies=[Depends(require_internal_token)],
)


@router.get("/settings")
async def get_settings(
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: AutomationService = Depends(get_automation_service),
):
    return await service.get_settings(owner_user_id)


@router.post("/settings")
async def update_settings(
    payload: AutomationSettingsUpdate,
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: AutomationService = Depends(get_automation_service),
    x_request_id: str | None = Header(default=None, alias="X-Request-ID"),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    return await service.update_settings(
        owner_user_id, payload, request_id=x_request_id, correlation_id=x_correlation_id
    )


@router.post("/run")
async def run_automation(
    owner_user_id: Annotated[str, Depends(require_owner_user_id)],
    service: AutomationService = Depends(get_automation_service),
    x_request_id: str | None = Header(default=None, alias="X-Request-ID"),
    x_correlation_id: str | None = Header(default=None, alias="X-Correlation-ID"),
):
    return await service.run(owner_user_id, request_id=x_request_id, correlation_id=x_correlation_id)
