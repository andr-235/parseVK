from __future__ import annotations

from typing import Any

from app.clients.base import ServiceClientHTTPError, ServiceClientUnavailableError
from app.clients.telegram.client import TelegramServiceClient
from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.modules._base import forward_service_request, translate_gateway_error
from fastapi import HTTPException, status


class TelegramExportGatewayService:
    def __init__(self, client: TelegramServiceClient):
        self.client = client

    async def _request(self, method: str, path: str, *, user_id: str, request_id: str | None = None, correlation_id: str | None = None, json: Any | None = None) -> Any:
        try:
            return await forward_service_request(
                self.client, method, path,
                user_id=user_id, request_id=request_id, correlation_id=correlation_id, json=json,
            )
        except (BackendServiceError, BackendUnavailableError) as exc:
            raise translate_gateway_error(exc) from exc

    async def get_dialogs(self, *, user_id: str, request_id: str | None = None, correlation_id: str | None = None) -> Any:
        return await self._request("GET", "/internal/telegram/dialogs", user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def start_live_parse(self, payload: dict, *, user_id: str, request_id: str | None = None, correlation_id: str | None = None) -> Any:
        return await self._request("POST", "/internal/telegram/live-parse", user_id=user_id, request_id=request_id, correlation_id=correlation_id, json=payload)

    async def start_export(self, payload: dict, *, user_id: str, request_id: str | None = None, correlation_id: str | None = None) -> Any:
        return await self._request("POST", "/internal/telegram/export", user_id=user_id, request_id=request_id, correlation_id=correlation_id, json=payload)

    async def get_job(self, job_id: str, *, user_id: str, request_id: str | None = None, correlation_id: str | None = None) -> Any:
        return await self._request("GET", f"/internal/telegram/jobs/{job_id}", user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def cancel_job(self, job_id: str, *, user_id: str, request_id: str | None = None, correlation_id: str | None = None) -> Any:
        return await self._request("POST", f"/internal/telegram/jobs/{job_id}/cancel", user_id=user_id, request_id=request_id, correlation_id=correlation_id)

    async def get_xlsx_bytes(self, job_id: str, *, user_id: str, request_id: str | None = None, correlation_id: str | None = None) -> bytes:
        try:
            return await self.client.get_xlsx_bytes(job_id, user_id=user_id, request_id=request_id, correlation_id=correlation_id)
        except ServiceClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except ServiceClientUnavailableError:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram service is unavailable") from None


def get_telegram_export_gateway_service() -> TelegramExportGatewayService:
    return TelegramExportGatewayService(TelegramServiceClient())
