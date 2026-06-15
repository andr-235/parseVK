from typing import Any

from app.clients.telegram import (
    TelegramServiceClient,
    TelegramServiceClientHTTPError,
    TelegramServiceClientUnavailableError,
)
from fastapi import HTTPException, status


class TelegramExportGatewayService:
    def __init__(self, client: TelegramServiceClient):
        self.client = client

    async def get_dialogs(
        self,
        *,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> Any:
        try:
            return await self.client.request(
                "GET",
                "/internal/telegram/dialogs",
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
            )
        except TelegramServiceClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except TelegramServiceClientUnavailableError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram service is unavailable") from exc

    async def start_live_parse(
        self,
        payload: dict,
        *,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> Any:
        try:
            return await self.client.request(
                "POST",
                "/internal/telegram/live-parse",
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                json=payload,
            )
        except TelegramServiceClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except TelegramServiceClientUnavailableError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram service is unavailable") from exc

    async def start_export(

        self,
        payload: dict,
        *,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> Any:
        try:
            return await self.client.request(
                "POST",
                "/internal/telegram/export",
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                json=payload,
            )
        except TelegramServiceClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except TelegramServiceClientUnavailableError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram service is unavailable") from exc

    async def get_job(
        self,
        job_id: str,
        *,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> Any:
        try:
            return await self.client.request(
                "GET",
                f"/internal/telegram/jobs/{job_id}",
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
            )
        except TelegramServiceClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except TelegramServiceClientUnavailableError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram service is unavailable") from exc

    async def cancel_job(
        self,
        job_id: str,
        *,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> Any:
        try:
            return await self.client.request(
                "POST",
                f"/internal/telegram/jobs/{job_id}/cancel",
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
            )
        except TelegramServiceClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except TelegramServiceClientUnavailableError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram service is unavailable") from exc

    async def get_xlsx_bytes(
        self,
        job_id: str,
        *,
        user_id: str,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> bytes:
        try:
            return await self.client.get_xlsx_bytes(
                job_id,
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
            )
        except TelegramServiceClientHTTPError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except TelegramServiceClientUnavailableError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Telegram service is unavailable") from exc


def get_telegram_export_gateway_service() -> TelegramExportGatewayService:
    return TelegramExportGatewayService(TelegramServiceClient())
