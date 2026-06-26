import logging

from fastapi import APIRouter, Depends, Query

from app.core.security import require_internal_token, require_owner_user_id
from app.modules.search.dependencies import get_search_service
from app.modules.search.service import SearchService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/search", tags=["search"])


@router.get("/messages")
async def search_messages(
    messenger: str | None = None,
    q: str | None = Query(default=None, alias="q"),
    chat_id: str | None = None,
    author: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    token: str = Depends(require_internal_token),
    service: SearchService = Depends(get_search_service),
) -> dict:
    return await service.search_messages(messenger, q, chat_id, author, page, limit)


@router.get("/messages/by-keywords")
async def search_by_keywords(
    messenger: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
    user_id: str = Depends(require_owner_user_id),
    token: str = Depends(require_internal_token),
    service: SearchService = Depends(get_search_service),
) -> dict:
    return await service.search_by_keywords(user_id, messenger, page, limit)
