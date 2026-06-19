from __future__ import annotations

import secrets
from collections.abc import AsyncGenerator

from app.clients.identity.client import IdentityClient
from app.core.config import settings
from app.core.security import bearer_token, validate_csrf
from app.core.utils import request_ids
from app.modules.auth.schemas import AuthResponse, AuthUser, ChangePasswordRequest, LoginRequest
from app.modules.auth.service import GatewayAuthService
from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Request, Response

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


async def get_auth_service() -> AsyncGenerator[GatewayAuthService, None]:
    async with IdentityClient() as client:
        yield GatewayAuthService(client)


def create_auth_service() -> GatewayAuthService:
    """Synchronous factory for service constructors (legacy pattern).

    Creates IdentityClient without cleanup — used only during the migration
    period. New code should use get_auth_service() with Depends instead.
    """
    return GatewayAuthService(IdentityClient())


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        settings.refresh_cookie_name,
        refresh_token,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        path="/",
    )


def set_csrf_cookie(response: Response, csrf_token: str) -> None:
    response.set_cookie(
        settings.csrf_cookie_name,
        csrf_token,
        httponly=False,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        path="/",
    )


def delete_auth_cookies(response: Response) -> None:
    response.delete_cookie(settings.refresh_cookie_name, path="/")
    response.delete_cookie(settings.csrf_cookie_name, path="/")


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    service: GatewayAuthService = Depends(get_auth_service),
) -> AuthResponse:
    request_id, correlation_id = request_ids(request)
    try:
        auth_response, refresh_token = await service.login(
            payload, request_id=request_id, correlation_id=correlation_id
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid credentials") from exc
    set_refresh_cookie(response, refresh_token)
    set_csrf_cookie(response, secrets.token_urlsafe(32))
    return auth_response


@router.post("/refresh", response_model=AuthResponse)
async def refresh(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=settings.refresh_cookie_name),
    csrf_header: str | None = Header(default=None, alias=settings.csrf_header_name),
    service: GatewayAuthService = Depends(get_auth_service),
) -> AuthResponse:
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    validate_csrf(request, csrf_header)
    request_id, correlation_id = request_ids(request)
    try:
        auth_response, new_refresh_token = await service.refresh(
            refresh_token, request_id=request_id, correlation_id=correlation_id
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Unauthorized") from exc
    set_refresh_cookie(response, new_refresh_token)
    set_csrf_cookie(response, secrets.token_urlsafe(32))
    return auth_response


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=settings.refresh_cookie_name),
    csrf_header: str | None = Header(default=None, alias=settings.csrf_header_name),
    service: GatewayAuthService = Depends(get_auth_service),
) -> dict[str, str]:
    validate_csrf(request, csrf_header)
    request_id, correlation_id = request_ids(request)
    if refresh_token:
        await service.logout(refresh_token, request_id=request_id, correlation_id=correlation_id)
    delete_auth_cookies(response)
    return {"status": "ok"}


@router.get("/me", response_model=AuthUser)
async def me(
    request: Request,
    authorization: str | None = Header(default=None, alias="Authorization"),
    service: GatewayAuthService = Depends(get_auth_service),
):
    request_id, correlation_id = request_ids(request)
    try:
        return await service.me(
            bearer_token(authorization), request_id=request_id, correlation_id=correlation_id
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Unauthorized") from exc


@router.post("/change-password", response_model=AuthResponse)
async def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    response: Response,
    authorization: str | None = Header(default=None, alias="Authorization"),
    csrf_header: str | None = Header(default=None, alias=settings.csrf_header_name),
    service: GatewayAuthService = Depends(get_auth_service),
) -> AuthResponse:
    validate_csrf(request, csrf_header)
    request_id, correlation_id = request_ids(request)
    try:
        auth_response, refresh_token = await service.change_password(
            bearer_token(authorization),
            payload,
            request_id=request_id,
            correlation_id=correlation_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Unauthorized") from exc
    set_refresh_cookie(response, refresh_token)
    set_csrf_cookie(response, secrets.token_urlsafe(32))
    return auth_response
