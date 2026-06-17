<<<<<<< HEAD
from fastapi import HTTPException, Request, status

from app.clients.identity.client import IdentityClient, IdentityClientHTTPError, IdentityClientUnavailableError
from app.modules.auth.router import bearer_token, get_auth_service, request_ids
from app.modules.auth.service import GatewayAuthService
=======
from app.clients.identity.client import IdentityClient
from app.modules._base import BaseGatewayService
from app.modules.auth.service import GatewayAuthService
from fastapi import HTTPException, Request, status
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


class AdminUsersGatewayService(BaseGatewayService):
    def __init__(self, client: IdentityClient | None = None, auth_service: GatewayAuthService | None = None):
        super().__init__(client or IdentityClient(), auth_service)

    async def forward(self, request: Request, method: str, path: str, *, json: dict | None = None, params: dict | None = None):
        claims = await self.claims(request)
        roles: list[str] = claims.get("roles") or []
        if "admin" not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return await super().forward(request, method, path, json=json, params=params)


def get_admin_users_gateway_service() -> AdminUsersGatewayService:
    return AdminUsersGatewayService()
