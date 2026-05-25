from typing import Annotated
from fastapi import APIRouter, Body, Depends, Query

from app.core.security import require_auth
from app.modules.watchlist.service import WatchlistGatewayService, get_watchlist_gateway_service

router = APIRouter(
    prefix="/api/v1/watchlist",
    tags=["watchlist"],
    dependencies=[Depends(require_auth)],
)


@router.get("/authors")
async def list_authors(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    excludeStopped: bool = Query(default=True),
    service: WatchlistGatewayService = Depends(get_watchlist_gateway_service),
):
    return await service.get_authors(offset=offset, limit=limit, exclude_stopped=excludeStopped)


@router.post("/authors")
async def create_author(
    payload: Annotated[dict, Body()],
    service: WatchlistGatewayService = Depends(get_watchlist_gateway_service),
):
    return await service.create_author(payload)


@router.get("/authors/{id}")
async def get_author_details(
    id: int,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    service: WatchlistGatewayService = Depends(get_watchlist_gateway_service),
):
    return await service.get_author_details(id=id, offset=offset, limit=limit)


@router.patch("/authors/{id}")
async def update_author(
    id: int,
    payload: Annotated[dict, Body()],
    service: WatchlistGatewayService = Depends(get_watchlist_gateway_service),
):
    return await service.update_author(id=id, payload=payload)


@router.get("/settings")
async def get_settings(
    service: WatchlistGatewayService = Depends(get_watchlist_gateway_service),
):
    return await service.get_settings()


@router.patch("/settings")
async def update_settings(
    payload: Annotated[dict, Body()],
    service: WatchlistGatewayService = Depends(get_watchlist_gateway_service),
):
    return await service.update_settings(payload)


@router.post("/refresh")
async def manual_refresh(
    service: WatchlistGatewayService = Depends(get_watchlist_gateway_service),
):
    return await service.manual_refresh()
