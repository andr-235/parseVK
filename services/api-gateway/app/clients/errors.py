from __future__ import annotations

from typing import Any


class InternalClientError(Exception):
    """Base error for internal service client failures."""


class InternalClientHTTPError(InternalClientError):
    def __init__(self, *, service_name: str, status_code: int, detail: Any) -> None:
        self.service_name = service_name
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"{service_name} service returned HTTP {status_code}")


class InternalClientUnavailableError(InternalClientError):
    def __init__(self, *, service_name: str) -> None:
        self.service_name = service_name
        super().__init__(f"{service_name} service is unavailable")
