from uuid import UUID

<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

=======
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
from app.core.config import settings
from app.core.jwt import build_jwks
from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.auth.jwt_service import JwtService
from app.modules.auth.repository import OutboxRepository, RefreshTokensRepository
from app.modules.auth.schemas import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
)
from app.modules.auth.service import AuthError, AuthResult, AuthService, BadAuthRequest
from app.modules.users.repository import UsersRepository
<<<<<<< HEAD
=======
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

router = APIRouter()


async def get_auth_service(session: AsyncSession = Depends(get_session)) -> AuthService:
    jwt_service = JwtService(
        refresh_token_ttl_days=settings.refresh_token_ttl_days
    )
    return AuthService(
        users=UsersRepository(session),
        refresh_tokens=RefreshTokensRepository(session),
        outbox=OutboxRepository(session),
        jwt_service=jwt_service,
    )


def to_response(result: AuthResult) -> AuthResponse:
    return AuthResponse(
        access_token=result.access_token,
        refresh_token=result.refresh_token,
        user=result.user,
    )


@router.get("/.well-known/jwks.json")
async def jwks() -> dict[str, list[dict[str, object]]]:
    return build_jwks()


@router.post(
    "/internal/auth/login",
    response_model=AuthResponse,
    dependencies=[Depends(require_internal_token)],
)
async def login(
    payload: LoginRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    try:
        result = await service.login(
            payload.username,
            payload.password,
            user_agent=request.headers.get("user-agent"),
            ip=request.client.host if request.client else None,
        )
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=exc.message) from exc
    return to_response(result)


@router.post(
    "/internal/auth/refresh",
    response_model=AuthResponse,
    dependencies=[Depends(require_internal_token)],
)
async def refresh(
    payload: RefreshRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    try:
        result = await service.refresh(
            payload.refresh_token,
            user_agent=request.headers.get("user-agent"),
            ip=request.client.host if request.client else None,
        )
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=exc.message) from exc
    return to_response(result)


@router.post("/internal/auth/logout", dependencies=[Depends(require_internal_token)])
async def logout(
    payload: LogoutRequest,
    service: AuthService = Depends(get_auth_service),
) -> dict[str, str]:
    await service.logout(payload.refresh_token)
    return {"status": "ok"}


@router.get(
    "/internal/auth/me",
    dependencies=[Depends(require_internal_token)],
)
async def me(
    user_id: UUID,
    service: AuthService = Depends(get_auth_service),
):
    try:
        return await service.me(user_id)
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=exc.message) from exc


@router.post(
    "/internal/auth/change-password",
    response_model=AuthResponse,
    dependencies=[Depends(require_internal_token)],
)
async def change_password(
    payload: ChangePasswordRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    try:
        result = await service.change_password(
            payload.user_id,
            payload.old_password,
            payload.new_password,
        )
    except BadAuthRequest as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=exc.message) from exc
    return to_response(result)
