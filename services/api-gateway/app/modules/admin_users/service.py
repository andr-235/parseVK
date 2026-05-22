from fastapi import HTTPException, Request, status

from app.clients.identity.client import IdentityClient, IdentityClientHTTPError, IdentityClientUnavailableError
from app.modules.auth.router import bearer_token, get_auth_service, request_ids
from app.modules.auth.service import GatewayAuthService


class AdminUsersGatewayService:
    def __init__(self, identity_client: IdentityClient, auth_service: GatewayAuthService):
        self.identity_client = identity_client
        self.auth_service = auth_service

    async def forward(
        self,
        request: Request,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ):
        authorization = request.headers.get("Authorization")
        try:
            claims = await self.auth_service.validate_token(bearer_token(authorization))
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from exc

        # Check for admin role
        if claims.get("role") != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        request_id, correlation_id = request_ids(request)
        try:
            response = await self.identity_client._request(
                method,
                path,
                request_id=request_id,
                correlation_id=correlation_id,
                json=json,
                params=params,
            )
            return response.json() if response.content else None
        except IdentityClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except IdentityClientUnavailableError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Identity service error") from exc


def get_admin_users_gateway_service() -> AdminUsersGatewayService:
    return AdminUsersGatewayService(IdentityClient(), get_auth_service())
