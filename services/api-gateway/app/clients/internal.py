from __future__ import annotations

from typing import Any

import httpx
from app.clients.errors import (
    InternalClientHTTPError,
    InternalClientUnavailableError,
)
from common.headers import (
    CALLER_SERVICE_HEADER,
    CORRELATION_ID_HEADER,
    INTERNAL_SERVICE_TOKEN_HEADER,
    REQUEST_ID_HEADER,
)

USER_ID_HEADER = "X-User-ID"
CALLER_SERVICE = "api-gateway"


class InternalServiceClient:
    def __init__(
        self,
        *,
        service_name: str,
        base_url: str,
        internal_token: str,
        timeout: httpx.Timeout | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.service_name = service_name
        self.base_url = base_url.rstrip("/")
        self.internal_token = internal_token
        self._client = client or httpx.AsyncClient(base_url=self.base_url, timeout=timeout)
        self._owns_client = client is None

    async def close(self) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def __aenter__(self) -> InternalServiceClient:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: object | None,
    ) -> None:
        await self.aclose()

    def headers(
        self,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict[str, str]:
        headers = {
            INTERNAL_SERVICE_TOKEN_HEADER: self.internal_token,
            CALLER_SERVICE_HEADER: CALLER_SERVICE,
        }
        if user_id is not None:
            headers[USER_ID_HEADER] = user_id
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
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
        params: dict | None = None,
        json: Any | None = None,
        files: Any | None = None,
    ) -> Any:
        response = await self.raw_request(
            method,
            path,
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params=params,
            json=json,
            files=files,
        )
        if not response.content:
            return None
        return response.json()

    async def raw_request(
        self,
        method: str,
        path: str,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
        params: dict | None = None,
        json: Any | None = None,
        files: Any | None = None,
    ) -> httpx.Response:
        try:
            response = await self._client.request(
                method,
                path,
                headers=self.headers(
                    user_id=user_id,
                    request_id=request_id,
                    correlation_id=correlation_id,
                ),
                params=params,
                json=json,
                files=files,
            )
            response.raise_for_status()
            return response
        except httpx.HTTPStatusError as exc:
            raise InternalClientHTTPError(
                service_name=self.service_name,
                status_code=exc.response.status_code,
                detail=self._response_detail(exc.response),
            ) from exc
        except httpx.RequestError as exc:
            raise InternalClientUnavailableError(service_name=self.service_name) from exc

    async def get_bytes(
        self,
        path: str,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
        params: dict | None = None,
    ) -> bytes:
        response = await self.raw_request(
            "GET",
            path,
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params=params,
        )
        return response.content

    @staticmethod
    def _response_detail(response: httpx.Response) -> Any:
        try:
            return response.json()
        except ValueError:
            return response.text
