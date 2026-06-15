from typing import Any

import httpx
from app.clients.internal import (
    InternalClientHTTPError,
    InternalClientUnavailableError,
    InternalServiceClient,
)
from app.core.config import settings


class TasksClientError(Exception):
    """Base error for tasks client failures."""


class TasksClientHTTPError(TasksClientError):
    def __init__(self, status_code: int, detail: Any):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"Tasks service returned HTTP {status_code}")


class TasksClientUnavailableError(TasksClientError):
    """Raised when tasks-service is unavailable."""


class TasksClient:
    def __init__(
        self,
        base_url: str | None = None,
        client: httpx.AsyncClient | None = None,
    ):
        self._internal = InternalServiceClient(
            service_name="Tasks",
            base_url=base_url or settings.tasks_base_url,
            internal_token=settings.internal_service_token,
            timeout=httpx.Timeout(timeout=10.0, connect=2.0, read=10.0, write=5.0),
            client=client,
        )
        self.base_url = self._internal.base_url
        self._client = self._internal._client
        self._owns_client = self._internal._owns_client

    async def close(self) -> None:
        await self._internal.close()

    def _headers(
        self,
        *,
        user_id: str,
        request_id: str | None,
        correlation_id: str | None,
    ) -> dict[str, str]:
        return self._internal.headers(
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )

    async def request(
        self,
        method: str,
        path: str,
        *,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
        json: dict | None = None,
        params: dict | None = None,
    ) -> Any:
        try:
            return await self._internal.request(
                method,
                path,
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                json=json,
                params=params,
            )
        except InternalClientHTTPError as exc:
            raise TasksClientHTTPError(status_code=exc.status_code, detail=exc.detail) from exc
        except InternalClientUnavailableError as exc:
            raise TasksClientUnavailableError("Tasks service is unavailable") from exc
