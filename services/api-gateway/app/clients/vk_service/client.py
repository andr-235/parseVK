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
    def __init__(self, base_url: str | None = None, client: httpx.AsyncClient | None = None) -> None:
        self.base_url = (base_url or settings.vk_service_base_url).rstrip("/")
        self._client = client or httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(timeout=30.0, connect=2.0, read=30.0, write=10.0),
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
        params: dict | None = None,
        json: Any | None = None,
        files: Any | None = None,
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
                params=params,
                json=json,
                files=files,
            )
            response.raise_for_status()
            if not response.content:
                return None
            return response.json()
        except httpx.HTTPStatusError as exc:
            try:
                detail: Any = exc.response.json()
            except ValueError:
                detail = exc.response.text
            raise VkServiceClientHTTPError(
                status_code=exc.response.status_code, detail=detail
            ) from exc
        except httpx.RequestError as exc:
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
            response = await self._client.get(
                f"/internal/{provider}/friends/jobs/{job_id}/download/xlsx",
                headers=self._headers(
                    user_id=user_id,
                    request_id=request_id,
                    correlation_id=correlation_id,
                ),
            )
            response.raise_for_status()
            return response.content
        except httpx.HTTPStatusError as exc:
            try:
                detail: Any = exc.response.json()
            except ValueError:
                detail = exc.response.text
            raise VkServiceClientHTTPError(
                status_code=exc.response.status_code, detail=detail
            ) from exc
        except httpx.RequestError as exc:
            raise VkServiceClientUnavailableError("VK service is unavailable") from exc
