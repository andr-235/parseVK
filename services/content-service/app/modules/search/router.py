import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.security import require_internal_token
from app.modules.search.dependencies import get_search_service
from app.modules.search.schemas import SearchMessagesRequest
from app.modules.search.service import SearchService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/internal/search",
    tags=["search"],
    dependencies=[Depends(require_internal_token)],
)


@router.get("/messages")
async def search_messages(
    service: Annotated[SearchService, Depends(get_search_service)],
    messenger: str | None = None,
    q: str | None = Query(default=None, alias="q"),
    chat_id: str | None = None,
    author: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
) -> dict:
    logger.info(
        "GET /internal/search/messages — messenger=%s, q=%s, page=%d, limit=%d",
        messenger, q, page, limit,
    )
    return await service.search_messages(messenger, q, chat_id, author, page, limit)


@router.post("/messages/search")
async def search_messages_post(
    service: Annotated[SearchService, Depends(get_search_service)],
    body: SearchMessagesRequest,
) -> dict:
    logger.info(
        "POST /internal/search/messages/search — only_with_keywords=%s, keywords=%s",
        body.only_with_keywords, body.keywords,
    )
    if body.only_with_keywords and body.keywords:
        return await service.search_messages_by_keywords(body)
    return await service.search_messages_dto(body)
