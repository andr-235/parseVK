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


class IdentityClientError(Exception):
    """Base error for identity client failures."""


class IdentityClientHTTPError(IdentityClientError):
    def __init__(self, status_code: int, detail: Any):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"Identity service returned HTTP {status_code}")


class IdentityClientUnavailableError(IdentityClientError):
    """Raised when identity-service is unavailable."""


class IdentityClient:
    def __init__(
        self,
        base_url: str | None = None,
        client: httpx.AsyncClient | None = None,
    ):
        self.base_url = (base_url or settings.identity_base_url).rstrip("/")
        self._client = client or httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(
                timeout=5.0,
                connect=2.0,
                read=5.0,
                write=5.0,
            ),
        )
        self._owns_client = client is None

    async def close(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    def _headers(
        self,
        request_id: str | None,
        correlation_id: str | None,
    ) -> dict[str, str]:
        headers = {
            INTERNAL_SERVICE_TOKEN_HEADER: settings.internal_service_token,
            CALLER_SERVICE_HEADER: "api-gateway",
        }

        if request_id:
            headers[REQUEST_ID_HEADER] = request_id

        if correlation_id:
            headers[CORRELATION_ID_HEADER] = correlation_id

        return headers

    async def _request(
        self,
        method: str,
        url: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
        internal: bool = True,
        **kwargs: Any,
    ) -> httpx.Response:
        headers = kwargs.pop("headers", {})

        if internal:
            headers.update(self._headers(request_id, correlation_id))

        try:
            response = await self._client.request(
                method=method,
                url=url,
                headers=headers,
                **kwargs,
            )
            response.raise_for_status()
            return response

        except httpx.HTTPStatusError as exc:
            try:
                detail: Any = exc.response.json()
            except ValueError:
                detail = exc.response.text

            raise IdentityClientHTTPError(
                status_code=exc.response.status_code,
                detail=detail,
            ) from exc

        except httpx.RequestError as exc:
            raise IdentityClientUnavailableError(
                "Identity service is unavailable"
            ) from exc

    async def login(
        self,
        payload: IdentityLoginRequest,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> IdentityAuthResponse:
        response = await self._request(
            "POST",
            "/internal/auth/login",
            json=payload.model_dump(mode="json"),
            request_id=request_id,
            correlation_id=correlation_id,
        )

        return IdentityAuthResponse.model_validate(response.json())

    async def refresh(
        self,
        refresh_token: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> IdentityAuthResponse:
        payload = IdentityRefreshRequest(refresh_token=refresh_token)

        response = await self._request(
            "POST",
            "/internal/auth/refresh",
            json=payload.model_dump(mode="json"),
            request_id=request_id,
            correlation_id=correlation_id,
        )

        return IdentityAuthResponse.model_validate(response.json())

    async def logout(
        self,
        refresh_token: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        payload = IdentityLogoutRequest(refresh_token=refresh_token)

        await self._request(
            "POST",
            "/internal/auth/logout",
            json=payload.model_dump(mode="json"),
            request_id=request_id,
            correlation_id=correlation_id,
        )

    async def me(
        self,
        access_token_subject: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> IdentityUser:
        response = await self._request(
            "GET",
            "/internal/auth/me",
            params={"user_id": access_token_subject},
            request_id=request_id,
            correlation_id=correlation_id,
        )

        return IdentityUser.model_validate(response.json())

    async def change_password(
        self,
        user_id: str,
        payload: IdentityChangePasswordRequest,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> IdentityAuthResponse:
        response = await self._request(
            "POST",
            "/internal/auth/change-password",
            params={"user_id": user_id},
            json=payload.model_dump(mode="json"),
            request_id=request_id,
            correlation_id=correlation_id,
        )

        return IdentityAuthResponse.model_validate(response.json())

    async def jwks(self) -> dict[str, Any]:
        response = await self._request(
            "GET",
            "/.well-known/jwks.json",
            internal=False,
        )

        return response.json()
