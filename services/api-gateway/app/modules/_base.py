from typing import Any

from app.clients.base import ServiceClient, ServiceClientHTTPError, ServiceClientUnavailableError
from app.core.security import bearer_token
from app.core.utils import request_ids
from app.modules.auth.router import get_auth_service
from app.modules.auth.service import GatewayAuthService
from fastapi import HTTPException, Request, status


class BaseGatewayService:
    def __init__(self, client: ServiceClient, auth_service: GatewayAuthService | None = None):
        self.client = client
        self.auth_service = auth_service or get_auth_service()

    async def forward(self, request: Request, method: str, path: str, *, params: dict | None = None, json: Any | None = None, files: Any | None = None) -> Any:
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
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"{self.client.service_name} service error") from None

    async def forward_json(self, request: Request, method: str, path: str, *, params: dict | None = None, json: Any | None = None) -> Any:
        return await self.forward(request, method, path, params=params, json=json)

    async def claims(self, request: Request) -> dict[str, Any]:
        authorization = request.headers.get("Authorization")
        try:
            return await self.auth_service.validate_token(bearer_token(authorization))
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from exc
