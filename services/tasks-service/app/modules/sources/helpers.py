"""Shared router helpers for the sources module.

Endpoint gating and error translation are identical across the sources
and access-scope routers; kept here to keep both routers thin.
"""

from fastapi import HTTPException, status

from app.core.config import settings
from app.modules.sources.errors import ScopeNotFoundError, TaskNotFoundError


def require_sources_enabled():
    if not settings.sources_api_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")


def map_source_error(exc: Exception) -> HTTPException:
    if isinstance(exc, (ScopeNotFoundError, TaskNotFoundError)):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
