<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.moderation.schemas import CommentModerationState, UpdateCommentReadStatus, CommentModerationList, CommentModerationCursorList
from app.modules.moderation.service import ModerationService
=======
from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.moderation.schemas import (
    CommentModerationCursorList,
    CommentModerationList,
    CommentModerationState,
    UpdateCommentReadStatus,
)
from app.modules.moderation.service import ModerationService
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

router = APIRouter(
    prefix="/internal/moderation",
    tags=["moderation"],
    dependencies=[Depends(require_internal_token)],
)


async def get_moderation_service(session: AsyncSession = Depends(get_session)) -> ModerationService:
    return ModerationService(session)


@router.get("/comments", response_model=CommentModerationList)
async def list_comments(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    readStatus: str | None = Query(None),
    search: str | None = Query(None),
    keywords: list[str] | None = Query(default=None),
    keywordSource: str | None = Query(None),
    service: ModerationService = Depends(get_moderation_service),
):
    result = await service.get_comments(
        page=page,
        limit=limit,
        read_status=readStatus,
        search=search,
        keywords=keywords,
        keyword_source=keywordSource
    )
    return {
        "items": [CommentModerationState.model_validate(item).model_dump() for item in result["items"]],
        "total": result["total"],
        "has_more": result["has_more"],
        "read_count": result["read_count"],
        "unread_count": result["unread_count"]
    }


@router.get("/comments/cursor", response_model=CommentModerationCursorList)
async def list_comments_cursor(
    cursor: str | None = Query(None),
    limit: int = Query(default=20, ge=1, le=100),
    readStatus: str | None = Query(None),
    search: str | None = Query(None),
    keywords: list[str] | None = Query(default=None),
    keywordSource: str | None = Query(None),
    service: ModerationService = Depends(get_moderation_service),
):
    result = await service.get_comments_cursor(
        cursor=cursor,
        limit=limit,
        read_status=readStatus,
        search=search,
        keywords=keywords,
        keyword_source=keywordSource
    )
    return {
        "items": [CommentModerationState.model_validate(item).model_dump() for item in result["items"]],
        "next_cursor": result["next_cursor"],
        "has_more": result["has_more"],
        "total": result["total"],
        "read_count": result["read_count"],
        "unread_count": result["unread_count"]
    }


@router.patch("/comments/{id}/read", response_model=CommentModerationState)
async def update_read_status(
    id: int,
    payload: UpdateCommentReadStatus,
    service: ModerationService = Depends(get_moderation_service),
):
    updated = await service.update_read_status(id, payload.is_read)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    return updated
