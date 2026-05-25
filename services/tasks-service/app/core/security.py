from fastapi import Header, HTTPException, status

from app.core.config import settings


async def require_internal_token(
    x_internal_service_token: str | None = Header(default=None, alias="X-Internal-Service-Token"),
) -> None:
    if not x_internal_service_token or x_internal_service_token != settings.internal_service_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


async def require_owner_user_id(
    x_user_id: str | None = Header(default=None, alias="X-User-ID"),
) -> str:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing X-User-ID")
    return x_user_id
