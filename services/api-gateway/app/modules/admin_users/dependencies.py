from typing import Any

from app.core.security import require_auth
from app.modules.admin_users.service import AdminUsersGatewayService
from fastapi import Depends, HTTPException, status


def get_admin_users_gateway_service() -> AdminUsersGatewayService:
    return AdminUsersGatewayService()


async def require_admin(
    claims: dict[str, Any] = Depends(require_auth),
) -> dict[str, Any]:
    if "admin" not in (claims.get("roles") or []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return claims
