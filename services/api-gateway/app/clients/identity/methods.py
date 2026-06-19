from typing import Any
from uuid import UUID

from app.clients.identity.schemas import (
    IdentityAuthResponse,
    IdentityChangePasswordRequest,
    IdentityLoginRequest,
    IdentityUser,
)
from app.clients.internal import (
    InternalClientHTTPError,
    InternalClientUnavailableError,
    InternalServiceClient,
)


class IdentityClientError(Exception):
    pass


class IdentityClientHTTPError(IdentityClientError):
    def __init__(self, status_code: int, detail: Any):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"Identity service returned HTTP {status_code}")


class IdentityClientUnavailableError(IdentityClientError):
    pass


class IdentityClientMethods:
    _internal: InternalServiceClient

    async def _request(
        self,
        method: str,
        path: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
        params: dict | None = None,
        json: Any | None = None,
    ) -> Any:
        try:
            return await self._internal.request(
                method,
                path,
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
                json=json,
            )
        except InternalClientHTTPError as exc:
            raise IdentityClientHTTPError(status_code=exc.status_code, detail=exc.detail) from exc
        except InternalClientUnavailableError as exc:
            raise IdentityClientUnavailableError("Identity service is unavailable") from exc

    async def login(
        self,
        payload: IdentityLoginRequest,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> IdentityAuthResponse:
        data = await self._request(
            "POST",
            "/internal/auth/login",
            request_id=request_id,
            correlation_id=correlation_id,
            json=payload.model_dump(),
        )
        return IdentityAuthResponse.model_validate(data)

    async def refresh(
        self,
        refresh_token: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> IdentityAuthResponse:
        data = await self._request(
            "POST",
            "/internal/auth/refresh",
            request_id=request_id,
            correlation_id=correlation_id,
            json={"refresh_token": refresh_token},
        )
        return IdentityAuthResponse.model_validate(data)

    async def logout(
        self,
        refresh_token: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        await self._request(
            "POST",
            "/internal/auth/logout",
            request_id=request_id,
            correlation_id=correlation_id,
            json={"refresh_token": refresh_token},
        )

    async def me(
        self,
        user_id: UUID | str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> IdentityUser:
        data = await self._request(
            "GET",
            "/internal/auth/me",
            request_id=request_id,
            correlation_id=correlation_id,
            params={"user_id": str(user_id)},
        )
        return IdentityUser.model_validate(data)

    async def change_password(
        self,
        user_id: UUID | str,
        payload: IdentityChangePasswordRequest,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> IdentityAuthResponse:
        data = await self._request(
            "POST",
            "/internal/auth/change-password",
            request_id=request_id,
            correlation_id=correlation_id,
            json=payload.model_dump(),
        )
        return IdentityAuthResponse.model_validate(data)

    async def jwks(self) -> dict[str, list[dict[str, object]]]:
        data = await self._request("GET", "/.well-known/jwks.json")
        return data
