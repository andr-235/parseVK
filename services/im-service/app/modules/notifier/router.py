import logging

from fastapi import APIRouter, Depends

from app.core.security import require_internal_token, require_owner_user_id
from app.modules.notifier.dependencies import get_notifier_service
from app.modules.notifier.schemas import NotifierStateResponse, NotifierStateUpdateRequest
from app.modules.notifier.service import NotifierService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/notifier", tags=["notifier"])


@router.get("/state")
async def get_state(
    messenger: str,
    user_id: str = Depends(require_owner_user_id),
    token: str = Depends(require_internal_token),
    service: NotifierService = Depends(get_notifier_service),
) -> NotifierStateResponse:
    state = await service.get_state(user_id, messenger)
    return NotifierStateResponse.model_validate(state)


@router.put("/state")
async def update_state(
    body: NotifierStateUpdateRequest,
    user_id: str = Depends(require_owner_user_id),
    token: str = Depends(require_internal_token),
    service: NotifierService = Depends(get_notifier_service),
) -> dict:
    await service.update_cursor(user_id, body.messenger, body.last_seen_message_id)
    return {"updated": True}


@router.get("/new-messages")
async def get_new_messages(
    messenger: str,
    limit: int = 100,
    user_id: str = Depends(require_owner_user_id),
    token: str = Depends(require_internal_token),
    service: NotifierService = Depends(get_notifier_service),
) -> dict:
    items = await service.get_new_messages(user_id, messenger, limit)
    return {"items": items, "count": len(items)}
