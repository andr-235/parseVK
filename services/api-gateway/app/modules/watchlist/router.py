from __future__ import annotations

from typing import Annotated

from app.core.security import require_auth
from app.core.utils import request_ids
from app.modules.watchlist.service import WatchlistGatewayService, get_watchlist_gateway_service
from fastapi import APIRouter, Body, Depends, Query, Request

router = APIRouter(
    prefix="/api/v1/watchlist",
    tags=["watchlist"],
)

OFFSET_QUERY = Query(default=0, ge=0)
LIMIT_QUERY = Query(default=20, ge=1, le=100)
EXCLUDE_STOPPED_QUERY = Query(default=True)
AUTH_DEPENDENCY = Depends(require_auth)
SERVICE_DEPENDENCY = Depends(get_watchlist_gateway_service)


@router.get("/authors")
async def list_authors(
    request: Request,
    offset: int = OFFSET_QUERY,
    limit: int = LIMIT_QUERY,
    excludeStopped: bool = EXCLUDE_STOPPED_QUERY,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: WatchlistGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.get_authors(
        offset=offset,
        limit=limit,
        exclude_stopped=excludeStopped,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.post("/authors")
async def create_author(
    request: Request,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: WatchlistGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.create_author(
        payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.get("/authors/{id}")
async def get_author_details(
    request: Request,
    id: int,
    offset: int = OFFSET_QUERY,
    limit: int = LIMIT_QUERY,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: WatchlistGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.get_author_details(
        id=id,
        offset=offset,
        limit=limit,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.patch("/authors/{id}")
async def update_author(
    request: Request,
    id: int,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: WatchlistGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.update_author(
        id=id,
        payload=payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.delete("/authors/{id}", status_code=204)
async def delete_author(
    request: Request,
    id: int,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: WatchlistGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    await service.delete_author(
        id=id,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )
    return


@router.get("/settings")
async def get_settings(
    request: Request,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: WatchlistGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.get_settings(
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.patch("/settings")
async def update_settings(
    request: Request,
    payload: Annotated[dict, Body()],
    auth_claims: dict = AUTH_DEPENDENCY,
    service: WatchlistGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.update_settings(
        payload,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.post("/refresh")
async def manual_refresh(
    request: Request,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: WatchlistGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.manual_refresh(
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )
