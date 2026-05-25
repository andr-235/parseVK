from typing import Any

import httpx

from common.headers import (
    CALLER_SERVICE_HEADER,
    CORRELATION_ID_HEADER,
    INTERNAL_SERVICE_TOKEN_HEADER,
    REQUEST_ID_HEADER,
)

from app.core.config import settings

USER_ID_HEADER = "X-User-ID"


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
        self.base_url = (base_url or settings.tasks_base_url).rstrip("/")
        self._client = client or httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(timeout=10.0, connect=2.0, read=10.0, write=5.0),
        )
        self._owns_client = client is None

    async def close(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    def _headers(
        self,
        *,
        user_id: str,
        request_id: str | None,
        correlation_id: str | None,
    ) -> dict[str, str]:
        headers = {
            INTERNAL_SERVICE_TOKEN_HEADER: settings.internal_service_token,
            CALLER_SERVICE_HEADER: "api-gateway",
            USER_ID_HEADER: user_id,
        }
        if request_id:
            headers[REQUEST_ID_HEADER] = request_id
        if correlation_id:
            headers[CORRELATION_ID_HEADER] = correlation_id
        return headers

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
            response = await self._client.request(
                method,
                path,
                headers=self._headers(
                    user_id=user_id,
                    request_id=request_id,
                    correlation_id=correlation_id,
                ),
                json=json,
                params=params,
            )
            response.raise_for_status()
            if response.status_code == 204:
                return None
            return response.json()
        except httpx.HTTPStatusError as exc:
            try:
                detail: Any = exc.response.json()
            except ValueError:
                detail = exc.response.text
            raise TasksClientHTTPError(status_code=exc.response.status_code, detail=detail) from exc
        except httpx.RequestError as exc:
            raise TasksClientUnavailableError("Tasks service is unavailable") from exc
