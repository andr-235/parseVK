from typing import Annotated

from app.core.security import require_auth
from app.core.utils import request_ids
from app.modules.comments.service import CommentsGatewayService, get_comments_gateway_service
from fastapi import APIRouter, Body, Depends, Query, Request

router = APIRouter(prefix="/api/v1/comments", tags=["comments"])

LIST_OFFSET_QUERY = Query(default=0, ge=0)
LIST_LIMIT_QUERY = Query(default=20, ge=1, le=100)
LIST_KEYWORDS_QUERY = Query(default=None)
LIST_KEYWORD_SOURCE_QUERY = Query(default=None)
LIST_READ_STATUS_QUERY = Query(default=None)
LIST_SEARCH_QUERY = Query(default=None)
CURSOR_QUERY = Query(default=None)
CURSOR_LIMIT_QUERY = Query(default=20, ge=1, le=100)
CURSOR_KEYWORDS_QUERY = Query(default=None)
CURSOR_KEYWORD_SOURCE_QUERY = Query(default=None)
CURSOR_READ_STATUS_QUERY = Query(default=None)
CURSOR_SEARCH_QUERY = Query(default=None)
AUTH_DEPENDENCY = Depends(require_auth)
SERVICE_DEPENDENCY = Depends(get_comments_gateway_service)


@router.get("")
async def list_comments(
    request: Request,
    offset: int = LIST_OFFSET_QUERY,
    limit: int = LIST_LIMIT_QUERY,
    keywords: list[str] | None = LIST_KEYWORDS_QUERY,
    keywordSource: str | None = LIST_KEYWORD_SOURCE_QUERY,
    readStatus: str | None = LIST_READ_STATUS_QUERY,
    search: str | None = LIST_SEARCH_QUERY,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: CommentsGatewayService = SERVICE_DEPENDENCY,
):
    # offset -> page conversion: gateway converts frontend offset to internal page
    page = (offset // limit) + 1
    request_id, correlation_id = request_ids(request)
    return await service.get_comments(
        page=page,
        limit=limit,
        keywords=keywords,
        keyword_source=keywordSource,
        read_status=readStatus,
        search=search,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.get("/cursor")
async def list_comments_cursor(
    request: Request,
    cursor: str | None = CURSOR_QUERY,
    limit: int = CURSOR_LIMIT_QUERY,
    keywords: list[str] | None = CURSOR_KEYWORDS_QUERY,
    keywordSource: str | None = CURSOR_KEYWORD_SOURCE_QUERY,
    readStatus: str | None = CURSOR_READ_STATUS_QUERY,
    search: str | None = CURSOR_SEARCH_QUERY,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: CommentsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.get_comments_cursor(
        cursor=cursor,
        limit=limit,
        keywords=keywords,
        keyword_source=keywordSource,
        read_status=readStatus,
        search=search,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.patch("/{id}/read")
async def update_read_status(
    request: Request,
    id: int,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: CommentsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    is_read = payload.get("isRead") if payload.get("isRead") is not None else payload.get("is_read")
    if is_read is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail="isRead field is required")
    try:
        return await service.patch_read_status(
            id,
            is_read=bool(is_read),
            user_id=str(auth_claims["sub"]),
            request_id=request_id,
            correlation_id=correlation_id,
        )
    except ValueError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/search")
async def search_comments(
    request: Request,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: CommentsGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.search_comments(
        payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )
