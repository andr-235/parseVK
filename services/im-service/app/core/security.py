from fastapi import Header, HTTPException, status

from app.core.config import settings


async def require_internal_token(authorization: str = Header(..., alias="X-Internal-Token")) -> str:
    if authorization != settings.internal_service_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid internal token")
    return authorization
