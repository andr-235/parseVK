from typing import Annotated

from fastapi import APIRouter, Body, Depends, Query

from app.core.security import require_auth
from app.modules.comments.service import CommentsGatewayService, get_comments_gateway_service

router = APIRouter(prefix="/api/v1/comments", tags=["comments"], dependencies=[Depends(require_auth)])


@router.get("")
async def list_comments(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    keywords: list[str] | None = Query(default=None),
    keywordSource: str | None = Query(default=None),
    readStatus: str | None = Query(default=None),
    search: str | None = Query(default=None),
    service: CommentsGatewayService = Depends(get_comments_gateway_service),
):
    # offset -> page conversion: gateway converts frontend offset to internal page
    page = (offset // limit) + 1
    return await service.get_comments(
        page=page,
        limit=limit,
        keywords=keywords,
        keyword_source=keywordSource,
        read_status=readStatus,
        search=search,
    )


@router.get("/cursor")
async def list_comments_cursor(
    cursor: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    keywords: list[str] | None = Query(default=None),
    keywordSource: str | None = Query(default=None),
    readStatus: str | None = Query(default=None),
    search: str | None = Query(default=None),
    service: CommentsGatewayService = Depends(get_comments_gateway_service),
):
    return await service.get_comments_cursor(
        cursor=cursor,
        limit=limit,
        keywords=keywords,
        keyword_source=keywordSource,
        read_status=readStatus,
        search=search,
    )


@router.patch("/{id}/read")
async def update_read_status(
    id: int,
    payload: Annotated[dict, Body()],
    service: CommentsGatewayService = Depends(get_comments_gateway_service),
):
    return await service.patch_read_status(id, payload)


@router.post("/search")
async def search_comments(
    payload: Annotated[dict, Body()],
    service: CommentsGatewayService = Depends(get_comments_gateway_service),
):
    return await service.search_comments(payload)
