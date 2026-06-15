import logging
from typing import Any

import httpx
from app.clients.internal import (
    InternalClientHTTPError,
    InternalClientUnavailableError,
)

logger = logging.getLogger("api-gateway.identity.methods")


class IdentityClientHTTPError(InternalClientHTTPError):
    pass


class IdentityClientUnavailableError(InternalClientUnavailableError):
    pass


class IdentityClientMethods:
    async def _request(
        self,
        method: str,
        path: str,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
        params: dict | None = None,
        json: Any | None = None,
    ) -> httpx.Response:
        logger.debug(
            "IdentityClient._request: %s %s (user_id=%s, request_id=%s, correlation_id=%s)",
            method, path, user_id, request_id, correlation_id,
        )
        try:
            response = await self._internal.raw_request(
                method, path,
                user_id=user_id, request_id=request_id, correlation_id=correlation_id,
                params=params, json=json,
            )
            return response
        except InternalClientHTTPError as exc:
            raise IdentityClientHTTPError(
                service_name=exc.service_name, status_code=exc.status_code, detail=exc.detail,
            ) from exc
        except InternalClientUnavailableError as exc:
            raise IdentityClientUnavailableError(service_name=exc.service_name) from exc

    async def jwks(self) -> dict[str, Any]:
        logger.debug("IdentityClient.jwks: fetching JWKS")
        response = await self._internal.request("GET", "/.well-known/jwks.json")
        logger.info("IdentityClient.jwks: fetched successfully")
        return response

    async def login(
        self,
        payload: Any,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> Any:
        logger.debug("IdentityClient.login: authenticating user")
        result = await self._internal.request(
            "POST", "/internal/auth/login",
            request_id=request_id, correlation_id=correlation_id,
            json=payload.model_dump(),
        )
        logger.info("IdentityClient.login: login successful")
        from app.clients.identity.schemas import IdentityAuthResponse
        return IdentityAuthResponse.model_validate(result)

    async def refresh(
        self,
        refresh_token: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> Any:
        logger.debug("IdentityClient.refresh: refreshing token")
        result = await self._internal.request(
            "POST", "/internal/auth/refresh",
            request_id=request_id, correlation_id=correlation_id,
            json={"refresh_token": refresh_token},
        )
        logger.info("IdentityClient.refresh: token refreshed successfully")
        from app.clients.identity.schemas import IdentityAuthResponse
        return IdentityAuthResponse.model_validate(result)

    async def logout(
        self,
        refresh_token: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> None:
        logger.debug("IdentityClient.logout: logging out")
        await self._internal.request(
            "POST", "/internal/auth/logout",
            request_id=request_id, correlation_id=correlation_id,
            json={"refresh_token": refresh_token},
        )
        logger.info("IdentityClient.logout: logout successful")

    async def me(
        self,
        user_id: str,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> Any:
        logger.debug("IdentityClient.me: fetching user %s", user_id)
        result = await self._internal.request(
            "GET", "/internal/auth/me",
            request_id=request_id, correlation_id=correlation_id,
            params={"user_id": user_id},
        )
        logger.info("IdentityClient.me: user %s fetched successfully", user_id)
        from app.clients.identity.schemas import IdentityUser
        return IdentityUser.model_validate(result)

    async def change_password(
        self,
        user_id: str,
        payload: Any,
        *,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> Any:
        logger.debug("IdentityClient.change_password: changing password for user %s", user_id)
        result = await self._internal.request(
            "POST", "/internal/auth/change-password",
            request_id=request_id, correlation_id=correlation_id,
            json=payload.model_dump(),
        )
        logger.info("IdentityClient.change_password: password changed successfully")
        from app.clients.identity.schemas import IdentityAuthResponse
        return IdentityAuthResponse.model_validate(result)
