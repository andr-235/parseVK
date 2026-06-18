from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.watchlist.schemas import (
    CreateWatchlistAuthorSchema,
    UpdateWatchlistAuthorSchema,
    WatchlistAuthorDetailsSchema,
    WatchlistAuthorListSchema,
    WatchlistAuthorSchema,
    WatchlistSettingsSchema,
    WatchlistSettingsUpdateSchema,
)
from app.modules.watchlist.service import WatchlistService
from fastapi import APIRouter, Depends, Query

router = APIRouter(
    prefix="/internal/watchlist",
    tags=["watchlist"],
    dependencies=[Depends(require_internal_token)],
)


async def get_watchlist_service(session=Depends(get_session)) -> WatchlistService:
    return WatchlistService(session)


@router.get("/authors", response_model=WatchlistAuthorListSchema)
async def list_authors(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    excludeStopped: bool = Query(default=True),
    service: WatchlistService = Depends(get_watchlist_service),
):
    result = await service.get_authors(offset=offset, limit=limit, exclude_stopped=excludeStopped)
    return {
        "items": [WatchlistAuthorSchema.model_validate(item).model_dump() for item in result["items"]],
        "total": result["total"],
        "hasMore": result["hasMore"],
    }


@router.post("/authors", response_model=WatchlistAuthorSchema)
async def create_author(
    payload: CreateWatchlistAuthorSchema,
    service: WatchlistService = Depends(get_watchlist_service),
):
    author = await service.create_author(author_vk_id=payload.author_vk_id, comment_id=payload.comment_id)
    return WatchlistAuthorSchema.model_validate(author)


@router.get("/authors/{id}", response_model=WatchlistAuthorDetailsSchema)
async def get_author_details(
    id: int,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    service: WatchlistService = Depends(get_watchlist_service),
):
    result = await service.get_author_details(id=id, offset=offset, limit=limit)
    return {
        **WatchlistAuthorSchema.model_validate(result["author"]).model_dump(),
        "comments": result["comments"],
    }


@router.patch("/authors/{id}", response_model=WatchlistAuthorSchema)
async def update_author(
    id: int,
    payload: UpdateWatchlistAuthorSchema,
    service: WatchlistService = Depends(get_watchlist_service),
):
    author = await service.update_author(id=id, payload=payload)
    return WatchlistAuthorSchema.model_validate(author)


@router.delete("/authors/{id}", status_code=204)
async def delete_author(
    id: int,
    service: WatchlistService = Depends(get_watchlist_service),
):
    await service.delete_author(id=id)
    return


@router.get("/settings", response_model=WatchlistSettingsSchema)
async def get_settings(
    service: WatchlistService = Depends(get_watchlist_service),
):
    settings_rec = await service.get_or_create_settings()
    return WatchlistSettingsSchema.model_validate(settings_rec)


@router.patch("/settings", response_model=WatchlistSettingsSchema)
async def update_settings(
    payload: WatchlistSettingsUpdateSchema,
    service: WatchlistService = Depends(get_watchlist_service),
):
    settings_rec = await service.update_settings(payload=payload)
    return WatchlistSettingsSchema.model_validate(settings_rec)


@router.post("/refresh")
async def manual_refresh(
    service: WatchlistService = Depends(get_watchlist_service),
):
    new_comments = await service.refresh_active_authors()
    return {"status": "ok", "new_comments": new_comments}
