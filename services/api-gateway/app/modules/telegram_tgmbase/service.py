from typing import Any
<<<<<<< HEAD
from fastapi import HTTPException, Request, status
import httpx

from app.clients.content.client import ContentClient, ContentClientHTTPError, ContentClientUnavailableError
from app.modules.auth.router import bearer_token, get_auth_service, request_ids
from app.modules.auth.service import GatewayAuthService
=======

import httpx
from app.clients.base import ServiceClient, ServiceClientHTTPError, ServiceClientUnavailableError
from app.core.config import settings
from app.core.security import bearer_token
from app.core.utils import request_ids
from app.modules.auth.router import get_auth_service
from app.modules.auth.service import GatewayAuthService
from fastapi import HTTPException, Request, status
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


class TelegramTgmbaseGatewayService:
    def __init__(self, client: ServiceClient | None = None, auth_service: GatewayAuthService | None = None):
        self.client = client or ServiceClient(service_name="Telegram", base_url=settings.telegram_service_base_url, internal_token=settings.internal_service_token)
        self.auth_service = auth_service or get_auth_service()

    async def forward(self, request: Request, method: str, path: str, *, params: dict | None = None, json: Any | None = None, files: Any | None = None):
        authorization = request.headers.get("Authorization")
        try:
            claims = await self.auth_service.validate_token(bearer_token(authorization))
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from exc

        request_id, correlation_id = request_ids(request)
        try:
            return await self.client.request(method, path, user_id=str(claims["sub"]), request_id=request_id, correlation_id=correlation_id, params=params, json=json, files=files)
        except ServiceClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except ServiceClientUnavailableError:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram service error") from None

    async def forward_raw(self, request: Request, method: str, path: str, *, params: dict | None = None) -> httpx.Response:
        authorization = request.headers.get("Authorization")
        try:
            claims = await self.auth_service.validate_token(bearer_token(authorization))
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from exc

        request_id, correlation_id = request_ids(request)
        try:
            return await self.client._internal.raw_request(method, path, user_id=str(claims["sub"]), request_id=request_id, correlation_id=correlation_id, params=params)
        except ServiceClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except ServiceClientUnavailableError:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram service error") from None


def get_telegram_tgmbase_gateway_service() -> TelegramTgmbaseGatewayService:
    return TelegramTgmbaseGatewayService()
