<<<<<<< HEAD
import httpx
from app.clients.identity.methods import (
    IdentityClientMethods,
    IdentityClientError,
    IdentityClientHTTPError,
    IdentityClientUnavailableError,
)
from app.clients.internal import InternalServiceClient
=======
import logging
from typing import Any

from app.clients.base import ServiceClient
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
from app.core.config import settings

logger = logging.getLogger("api-gateway.identity.client")


class IdentityClient(ServiceClient):
    def __init__(self):
        from httpx import Timeout
        super().__init__(
            service_name="Identity",
            base_url=settings.identity_base_url,
            internal_token=settings.internal_service_token,
            timeout=Timeout(timeout=5.0, connect=2.0, read=5.0, write=5.0),
        )

    async def jwks(self) -> dict[str, Any]:
        return await self.request("GET", "/.well-known/jwks.json")

    async def login(self, payload: Any, *, request_id: str | None = None, correlation_id: str | None = None) -> Any:
        from app.clients.identity.schemas import IdentityAuthResponse
        result = await self.request("POST", "/internal/auth/login", user_id="", request_id=request_id, correlation_id=correlation_id, json=payload.model_dump())
        return IdentityAuthResponse.model_validate(result)

    async def refresh(self, refresh_token: str, *, request_id: str | None = None, correlation_id: str | None = None) -> Any:
        from app.clients.identity.schemas import IdentityAuthResponse
        result = await self.request("POST", "/internal/auth/refresh", user_id="", request_id=request_id, correlation_id=correlation_id, json={"refresh_token": refresh_token})
        return IdentityAuthResponse.model_validate(result)

    async def logout(self, refresh_token: str, *, request_id: str | None = None, correlation_id: str | None = None) -> None:
        await self.request("POST", "/internal/auth/logout", user_id="", request_id=request_id, correlation_id=correlation_id, json={"refresh_token": refresh_token})

    async def me(self, user_id: str, *, request_id: str | None = None, correlation_id: str | None = None) -> Any:
        from app.clients.identity.schemas import IdentityUser
        result = await self.request("GET", "/internal/auth/me", user_id=user_id, request_id=request_id, correlation_id=correlation_id, params={"user_id": user_id})
        return IdentityUser.model_validate(result)

    async def change_password(self, user_id: str, payload: Any, *, request_id: str | None = None, correlation_id: str | None = None) -> Any:
        from app.clients.identity.schemas import IdentityAuthResponse
        result = await self.request("POST", "/internal/auth/change-password", user_id=user_id, request_id=request_id, correlation_id=correlation_id, json=payload.model_dump())
        return IdentityAuthResponse.model_validate(result)
