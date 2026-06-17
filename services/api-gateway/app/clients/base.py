from typing import Any

import httpx
from app.clients.internal import (
    InternalClientHTTPError,
    InternalClientUnavailableError,
    InternalServiceClient,
)


class ServiceClientError(Exception):
    pass


class ServiceClientHTTPError(ServiceClientError):
    def __init__(self, service_name: str, status_code: int, detail: Any) -> None:
        self.service_name = service_name
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"{service_name} service returned HTTP {status_code}")


class ServiceClientUnavailableError(ServiceClientError):
    def __init__(self, service_name: str) -> None:
        self.service_name = service_name
        super().__init__(f"{service_name} service is unavailable")


class ServiceClient:
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
        self._internal = InternalServiceClient(
            service_name=service_name,
            base_url=base_url,
            internal_token=internal_token,
            timeout=timeout,
            client=client,
        )
        self.base_url = self._internal.base_url

    async def close(self) -> None:
        await self._internal.close()

    async def request(
        self,
        method: str,
        path: str,
        *,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
        params: dict | None = None,
        json: Any | None = None,
        files: Any | None = None,
    ) -> Any:
        try:
            return await self._internal.request(
                method, path,
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
                json=json,
                files=files,
            )
        except InternalClientHTTPError as exc:
            raise ServiceClientHTTPError(
                service_name=self.service_name,
                status_code=exc.status_code,
                detail=exc.detail,
            ) from exc
        except InternalClientUnavailableError as exc:
            raise ServiceClientUnavailableError(service_name=self.service_name) from exc

    async def get_bytes(
        self,
        path: str,
        *,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
        params: dict | None = None,
    ) -> bytes:
        try:
            return await self._internal.get_bytes(
                path,
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
            )
        except InternalClientHTTPError as exc:
            raise ServiceClientHTTPError(
                service_name=self.service_name,
                status_code=exc.status_code,
                detail=exc.detail,
            ) from exc
        except InternalClientUnavailableError as exc:
            raise ServiceClientUnavailableError(service_name=self.service_name) from exc
