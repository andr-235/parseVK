from typing import Any

import httpx

from common.headers import (
    CALLER_SERVICE_HEADER,
    CORRELATION_ID_HEADER,
    INTERNAL_SERVICE_TOKEN_HEADER,
    REQUEST_ID_HEADER,
)

from app.clients.identity.schemas import (
    IdentityAuthResponse,
    IdentityChangePasswordRequest,
    IdentityLoginRequest,
    IdentityLogoutRequest,
    IdentityRefreshRequest,
    IdentityUser,
)
from app.core.config import settings


class IdentityClient:
    def __init__(self, base_url: str = settings.identity_base_url):
        self.base_url = base_url.rstrip("/")

    def _headers(self, request_id: str | None, correlation_id: str | None) -> dict[str, str]:
        headers = {
            INTERNAL_SERVICE_TOKEN_HEADER: settings.internal_service_token,
            CALLER_SERVICE_HEADER: "api-gateway",
        }
        if request_id:
            headers[REQUEST_ID_HEADER] = request_id
        if correlation_id:
            headers[CORRELATION_ID_HEADER] = correlation_id
        return headers

    async def login(
        self,
        payload: IdentityLoginRequest,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> IdentityAuthResponse:
        async with httpx.AsyncClient(base_url=self.base_url) as client:
            response = await client.post(
                "/internal/auth/login",
                json=payload.model_dump(),
                headers=self._headers(request_id, correlation_id),
            )
        response.raise_for_status()
        return IdentityAuthResponse.model_validate(response.json())

    async def refresh(
        self,
        refresh_token: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> IdentityAuthResponse:
        async with httpx.AsyncClient(base_url=self.base_url) as client:
            response = await client.post(
                "/internal/auth/refresh",
                json=IdentityRefreshRequest(refresh_token=refresh_token).model_dump(),
                headers=self._headers(request_id, correlation_id),
            )
        response.raise_for_status()
        return IdentityAuthResponse.model_validate(response.json())

    async def logout(
        self,
        refresh_token: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        async with httpx.AsyncClient(base_url=self.base_url) as client:
            response = await client.post(
                "/internal/auth/logout",
                json=IdentityLogoutRequest(refresh_token=refresh_token).model_dump(),
                headers=self._headers(request_id, correlation_id),
            )
        response.raise_for_status()

    async def me(
        self,
        access_token_subject: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> IdentityUser:
        async with httpx.AsyncClient(base_url=self.base_url) as client:
            response = await client.get(
                "/internal/auth/me",
                params={"user_id": access_token_subject},
                headers=self._headers(request_id, correlation_id),
            )
        response.raise_for_status()
        return IdentityUser.model_validate(response.json())

    async def change_password(
        self,
        user_id: str,
        payload: IdentityChangePasswordRequest,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> IdentityAuthResponse:
        async with httpx.AsyncClient(base_url=self.base_url) as client:
            response = await client.post(
                "/internal/auth/change-password",
                json=payload.model_dump(mode="json"),
                headers=self._headers(request_id, correlation_id),
            )
        response.raise_for_status()
        return IdentityAuthResponse.model_validate(response.json())

    async def jwks(self) -> dict[str, Any]:
        async with httpx.AsyncClient(base_url=self.base_url) as client:
            response = await client.get("/.well-known/jwks.json")
        response.raise_for_status()
        return response.json()
