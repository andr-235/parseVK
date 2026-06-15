from typing import Any

from app.clients.content.client import (
    ContentClient,
    ContentClientHTTPError,
    ContentClientUnavailableError,
)
from app.modules.auth.router import bearer_token, get_auth_service, request_ids
from app.modules.auth.service import GatewayAuthService
from fastapi import HTTPException, Request, status


class MonitoringGatewayService:
    def __init__(self, content_client: ContentClient, auth_service: GatewayAuthService):
        self.content_client = content_client
        self.auth_service = auth_service

    async def forward_json(
        self,
        request: Request,
        method: str,
        path: str,
        *,
        params: dict | None = None,
        json: Any | None = None,
    ):
        claims = await self.claims(request)
        request_id, correlation_id = request_ids(request)
        try:
            return await self.content_client.request(
                method,
                path,
                user_id=str(claims["sub"]),
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
                json=json,
            )
        except ContentClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except ContentClientUnavailableError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Content service error") from exc

    async def claims(self, request: Request) -> dict[str, Any]:
        authorization = request.headers.get("Authorization")
        try:
            return await self.auth_service.validate_token(bearer_token(authorization))
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from exc


def get_monitoring_gateway_service() -> MonitoringGatewayService:
    return MonitoringGatewayService(ContentClient(), get_auth_service())
