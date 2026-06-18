from __future__ import annotations

from typing import Any


class GatewayError(Exception):
    """Base domain exception for API Gateway.

    All service-layer exceptions inherit from this.
    Router layer translates these to FastAPI HTTPException.
    """

    def __init__(
        self,
        *,
        status_code: int,
        detail: str,
        code: str | None = None,
    ) -> None:
        self.status_code = status_code
        self.detail = detail
        self.code = code or f"GATEWAY_{status_code}"
        super().__init__(f"[{self.code}] {detail}")

    def to_http_kwargs(self) -> dict[str, Any]:
        return {
            "status_code": self.status_code,
            "detail": self.detail,
        }


class ServiceNotFoundError(GatewayError):
    def __init__(
        self,
        detail: str = "Resource not found",
        *,
        code: str | None = None,
    ) -> None:
        super().__init__(status_code=404, detail=detail, code=code or "RESOURCE_NOT_FOUND")


class ServiceValidationError(GatewayError):
    def __init__(
        self,
        detail: str = "Validation failed",
        *,
        code: str | None = None,
    ) -> None:
        super().__init__(status_code=422, detail=detail, code=code or "VALIDATION_ERROR")


class ServiceAuthError(GatewayError):
    def __init__(
        self,
        detail: str = "Authentication failed",
        *,
        code: str | None = None,
    ) -> None:
        super().__init__(status_code=401, detail=detail, code=code or "AUTH_ERROR")


class ServiceForbiddenError(GatewayError):
    def __init__(
        self,
        detail: str = "Forbidden",
        *,
        code: str | None = None,
    ) -> None:
        super().__init__(status_code=403, detail=detail, code=code or "FORBIDDEN")


class ServiceConflictError(GatewayError):
    def __init__(
        self,
        detail: str = "Conflict",
        *,
        code: str | None = None,
    ) -> None:
        super().__init__(status_code=409, detail=detail, code=code or "CONFLICT")


class BackendServiceError(GatewayError):
    """Error from a backend service (internal HTTP call failed).

    Wraps ServiceClientHTTPError into a domain exception.
    """

    def __init__(
        self,
        *,
        service_name: str,
        status_code: int,
        detail: Any,
    ) -> None:
        detail_str = detail.get("detail", detail) if isinstance(detail, dict) else str(detail)
        super().__init__(
            status_code=status_code,
            detail=f"{service_name} service error: {detail_str}",
            code="BACKEND_SERVICE_ERROR",
        )
        self.service_name = service_name


class BackendUnavailableError(GatewayError):
    """Backend service is unavailable (connection refused, timeout)."""

    def __init__(
        self,
        *,
        service_name: str,
    ) -> None:
        super().__init__(
            status_code=502,
            detail=f"{service_name} service is unavailable",
            code="BACKEND_UNAVAILABLE",
        )
        self.service_name = service_name
