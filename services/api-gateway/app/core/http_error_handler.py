from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, Request, status

from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.core.security import bearer_token
from app.core.utils import request_ids
from app.modules._base import (
    BaseGatewayService,
    forward_service_request,
    translate_gateway_error,
)
from app.modules.auth.service import GatewayAuthService

logger = logging.getLogger(__name__)


async def get_claims_from_request(
    request: Request,
    auth_service: GatewayAuthService,
) -> dict[str, Any]:
    """Validate token from request Authorization header and return claims."""
    authorization = request.headers.get("Authorization")
    try:
        token = bearer_token(authorization)
        return await auth_service.validate_token(token)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to validate token: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        ) from exc


async def forward_authenticated(
    request: Request,
    service: BaseGatewayService,
    auth_service: GatewayAuthService,
    method: str,
    path: str,
    *,
    params: dict | None = None,
    json: Any | None = None,
    files: Any | None = None,
) -> Any:
    """Forward a request with authentication extracted from the FastAPI Request.

    This is the new recommended pattern for routers. It:
    1. Extracts and validates the token from the request
    2. Calls the backend service via forward_service_request()
    3. Translates domain exceptions to HTTPException

    Usage in router:
        result = await forward_authenticated(
            request, service, auth_service,
            "POST", "/path", json=payload,
        )
    """
    claims = await get_claims_from_request(request, auth_service)
    request_id_value, correlation_id_value = request_ids(request)

    try:
        return await forward_service_request(
            service.client,
            method,
            path,
            user_id=str(claims["sub"]),
            request_id=request_id_value,
            correlation_id=correlation_id_value,
            params=params,
            json=json,
            files=files,
        )
    except (BackendServiceError, BackendUnavailableError) as exc:
        raise translate_gateway_error(exc) from exc
