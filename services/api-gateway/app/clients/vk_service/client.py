from typing import Any

import httpx
from app.clients.internal import (
    InternalClientHTTPError,
    InternalClientUnavailableError,
    InternalServiceClient,
)
from app.core.config import settings


class VkServiceClientError(Exception):
    pass


class VkServiceClientHTTPError(VkServiceClientError):
    def __init__(self, status_code: int, detail: Any) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"VK service returned HTTP {status_code}")


class VkServiceClientUnavailableError(VkServiceClientError):
    pass


class VkServiceClient:
    def __init__(
        self,
        base_url: str | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self._internal = InternalServiceClient(
            service_name="VK",
            base_url=base_url or settings.vk_service_base_url,
            internal_token=settings.internal_service_token,
            timeout=httpx.Timeout(timeout=30.0, connect=2.0, read=30.0, write=10.0),
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
        params: dict | None = None,
        json: Any | None = None,
        files: Any | None = None,
    ) -> Any:
        try:
            return await self._internal.request(
                method,
                path,
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
                json=json,
                files=files,
            )
        except InternalClientHTTPError as exc:
            raise VkServiceClientHTTPError(
                status_code=exc.status_code, detail=exc.detail
            ) from exc
        except InternalClientUnavailableError as exc:
            raise VkServiceClientUnavailableError("VK service is unavailable") from exc

    async def get_xlsx_bytes(
        self,
        job_id: str,
        provider: str = "vk",
        *,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> bytes:
        try:
            return await self._internal.get_bytes(
                f"/internal/{provider}/friends/jobs/{job_id}/download/xlsx",
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
            )
        except InternalClientHTTPError as exc:
            raise VkServiceClientHTTPError(
                status_code=exc.status_code, detail=exc.detail
            ) from exc
        except InternalClientUnavailableError as exc:
            raise VkServiceClientUnavailableError("VK service is unavailable") from exc
