from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.jwt import build_jwks
from app.db.models import RefreshToken, utc_now
from app.db.session import get_session
from app.modules.auth.schemas import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
)
from app.modules.auth.service import AuthError, AuthResult, AuthService, BadAuthRequest
from app.modules.outbox.service import add_identity_event
from app.modules.users.repository import UsersRepository

router = APIRouter()


class RefreshTokensRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_by_hash(self, token_hash: str) -> RefreshToken | None:
        return await self.session.scalar(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )

    async def save_token(self, token: RefreshToken) -> None:
        self.session.add(token)
        await self.session.flush()

    async def revoke_family(self, token_family_id: UUID) -> None:
        tokens = await self.session.scalars(
            select(RefreshToken).where(
                RefreshToken.token_family_id == token_family_id,
                RefreshToken.revoked_at.is_(None),
            )
        )
        now = utc_now()
        for token in tokens:
            token.revoked_at = now


class OutboxRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_identity_event(self, event_type: str, user_id: str) -> None:
        await add_identity_event(self.session, event_type=event_type, user_id=user_id)


async def require_internal_token(
    x_internal_service_token: str | None = Header(default=None, alias="X-Internal-Service-Token"),
) -> None:
    if x_internal_service_token != settings.internal_service_token:
        raise HTTPException(status_code=403, detail="Forbidden")


async def get_auth_service(session: AsyncSession = Depends(get_session)) -> AuthService:
    return AuthService(
        users=UsersRepository(session),
        refresh_tokens=RefreshTokensRepository(session),
        outbox=OutboxRepository(session),
        refresh_token_ttl_days=settings.refresh_token_ttl_days,
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
