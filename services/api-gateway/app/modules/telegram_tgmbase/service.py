from __future__ import annotations

from typing import Any

from app.clients.errors import InternalClientHTTPError, InternalClientUnavailableError
from app.clients.telegram.client import TelegramServiceClient
from app.modules._base import BaseGatewayService
from app.modules.auth.service import GatewayAuthService
from fastapi import HTTPException, Request, status


class TelegramTgmbaseGatewayService(BaseGatewayService):
    def __init__(self, client: TelegramServiceClient | None = None, auth_service: GatewayAuthService | None = None):
        super().__init__(client or TelegramServiceClient(), auth_service)

    async def forward_raw(self, request: Request, method: str, path: str, *, params: dict[str, Any] | None = None) -> Any:
        claims = await self.claims(request)
        request_id, correlation_id = self._extract_ids(request)
        try:
            return await self.client.raw_request(method, path, user_id=str(claims["sub"]), request_id=request_id, correlation_id=correlation_id, params=params)
        except InternalClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except InternalClientUnavailableError:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram service error") from None

    @staticmethod
    def _extract_ids(request: Request) -> tuple[str | None, str | None]:
        from app.core.utils import request_ids

        return request_ids(request)


def get_telegram_tgmbase_gateway_service() -> TelegramTgmbaseGatewayService:
    return TelegramTgmbaseGatewayService()
