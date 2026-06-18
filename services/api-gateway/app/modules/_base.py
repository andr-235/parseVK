from __future__ import annotations

import logging
from typing import Any

from app.clients.base import ServiceClient, ServiceClientHTTPError, ServiceClientUnavailableError
from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.core.security import bearer_token
from app.core.utils import request_ids
from app.modules.auth.router import create_auth_service
from app.modules.auth.service import GatewayAuthService
from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)


def translate_gateway_error(error: BackendServiceError | BackendUnavailableError) -> HTTPException:
    """Translate a domain exception to FastAPI HTTPException."""
    logger.debug(
        "Translating gateway error: %s status=%s",
        type(error).__name__, error.status_code,
    )
    if isinstance(error, BackendUnavailableError):
        return HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{error.service_name} service error",
        )
    return HTTPException(status_code=error.status_code, detail=error.detail)


async def forward_service_request(
    client: ServiceClient,
    method: str,
    path: str,
    *,
    user_id: str | None = None,
    request_id: str | None = None,
    correlation_id: str | None = None,
    params: dict | None = None,
    json: Any | None = None,
    files: Any | None = None,
) -> Any:
    """Core request forwarding logic — raises domain exceptions, no FastAPI dependency.

    This function is the building block for both the legacy forward() method
    and the new router helper pattern.
    """
    try:
        return await client.request(
            method,
            path,
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params=params,
            json=json,
            files=files,
        )
    except ServiceClientHTTPError as exc:
        logger.warning(
            "Backend service error: %s %s -> %s %s",
            method, path, exc.status_code, exc.detail,
        )
        raise BackendServiceError(
            service_name=client.service_name,
            status_code=exc.status_code,
            detail=exc.detail,
        ) from exc
    except ServiceClientUnavailableError as exc:
        logger.error(
            "Backend service unavailable: %s %s -> %s",
            method, path, client.service_name,
        )
        raise BackendUnavailableError(
            service_name=client.service_name,
        ) from exc


class BaseGatewayService:
    def __init__(self, client: ServiceClient, auth_service: GatewayAuthService | None = None) -> None:
        self.client = client
        self.auth_service = auth_service or create_auth_service()

    async def forward(self, request: Request, method: str, path: str, *, params: dict | None = None, json: Any | None = None, files: Any | None = None) -> Any:
        """Forward request to backend service.

        Deprecated: will be replaced by direct calls to forward_service_request()
        from router layer. Kept for backward compatibility during migration.
        """
        authorization = request.headers.get("Authorization")
        try:
            claims = await self.auth_service.validate_token(bearer_token(authorization))
        except Exception as exc:
            logger.warning("Token validation failed: %s", exc)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from exc

        request_id_value, correlation_id_value = request_ids(request)
        try:
            return await forward_service_request(
                self.client,
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

    async def forward_json(self, request: Request, method: str, path: str, *, params: dict | None = None, json: Any | None = None) -> Any:
        return await self.forward(request, method, path, params=params, json=json)

    async def claims(self, request: Request) -> dict[str, Any]:
        authorization = request.headers.get("Authorization")
        try:
            return await self.auth_service.validate_token(bearer_token(authorization))
        except Exception as exc:
            logger.warning("Token validation failed for claims: %s", exc)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from exc
