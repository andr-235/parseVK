from typing import Any

import httpx
from app.clients.identity.schemas import (
    IdentityAuthResponse,
    IdentityChangePasswordRequest,
    IdentityLoginRequest,
    IdentityLogoutRequest,
    IdentityRefreshRequest,
    IdentityUser,
)
from app.clients.internal import (
    InternalClientHTTPError,
    InternalClientUnavailableError,
    InternalServiceClient,
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
        self._internal = InternalServiceClient(
            service_name="Identity",
            base_url=base_url or settings.identity_base_url,
            internal_token=settings.internal_service_token,
            timeout=httpx.Timeout(
                timeout=5.0,
                connect=2.0,
                read=5.0,
                write=5.0,
            ),
            client=client,
        )
        self.base_url = self._internal.base_url
        self._client = self._internal._client
        self._owns_client = self._internal._owns_client

    async def close(self) -> None:
        await self._internal.close()

    def _headers(
        self,
        request_id: str | None,
        correlation_id: str | None,
    ) -> dict[str, str]:
        return self._internal.headers(request_id=request_id, correlation_id=correlation_id)

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
            try:
                return await self._internal.raw_request(
                    method,
                    url,
                    request_id=request_id,
                    correlation_id=correlation_id,
                    **kwargs,
                )
            except InternalClientHTTPError as exc:
                raise IdentityClientHTTPError(
                    status_code=exc.status_code,
                    detail=exc.detail,
                ) from exc
            except InternalClientUnavailableError as exc:
                raise IdentityClientUnavailableError(
                    "Identity service is unavailable"
                ) from exc

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
