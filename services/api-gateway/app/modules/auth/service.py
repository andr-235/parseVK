from typing import Any

from app.clients.identity.client import IdentityClient
from app.clients.identity.schemas import IdentityChangePasswordRequest, IdentityLoginRequest
from app.core.security import validate_access_token
from app.modules.auth.schemas import AuthResponse, AuthUser, ChangePasswordRequest, LoginRequest


class GatewayAuthService:
    def __init__(self, identity: IdentityClient):
        self.identity = identity
        self._jwks: dict[str, Any] | None = None

    async def login(
        self, payload: LoginRequest, *, request_id: str | None, correlation_id: str | None
    ):
        result = await self.identity.login(
            IdentityLoginRequest(username=payload.username, password=payload.password),
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return self._to_response(result), result.refresh_token

    async def refresh(
        self, refresh_token: str, *, request_id: str | None, correlation_id: str | None
    ):
        result = await self.identity.refresh(
            refresh_token,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return self._to_response(result), result.refresh_token

    async def logout(
        self, refresh_token: str, *, request_id: str | None, correlation_id: str | None
    ) -> None:
        await self.identity.logout(
            refresh_token,
            request_id=request_id,
            correlation_id=correlation_id,
        )

    async def me(
        self, access_token: str, *, request_id: str | None, correlation_id: str | None
    ) -> AuthUser:
        claims = await self.validate_token(access_token)
        user = await self.identity.me(
            claims["sub"],
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return AuthUser.model_validate(user.model_dump())

    async def change_password(
        self,
        access_token: str,
        payload: ChangePasswordRequest,
        *,
        request_id: str | None,
        correlation_id: str | None,
    ):
        claims = await self.validate_token(access_token)
        result = await self.identity.change_password(
            claims["sub"],
            IdentityChangePasswordRequest(
                user_id=claims["sub"],
                old_password=payload.old_password,
                new_password=payload.new_password,
            ),
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return self._to_response(result), result.refresh_token

    async def validate_token(self, access_token: str) -> dict[str, Any]:
        if self._jwks is None:
            self._jwks = await self.identity.jwks()
        return validate_access_token(access_token, self._jwks)

    def _to_response(self, identity_result) -> AuthResponse:
        return AuthResponse(
            access_token=identity_result.access_token,
            user=AuthUser.model_validate(identity_result.user.model_dump()),
        )
