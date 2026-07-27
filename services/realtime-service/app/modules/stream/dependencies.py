"""Auth dependencies for realtime-service internal endpoints."""

from __future__ import annotations

from fastapi import Header, HTTPException

from app.core.config import settings


async def verify_internal_token(
    x_internal_service_token: str = Header(...),
) -> None:
    if x_internal_service_token != settings.internal_service_token:
        raise HTTPException(status_code=401, detail="Invalid internal service token")
