from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import StreamingResponse

from app.core.security import require_auth
from app.modules.auth.router import request_ids
from app.modules.telegram_export.schemas import (
    TelegramExportStartRequest,
    TelegramExportStartResponse,
    TelegramJobDetailResponse,
)
from app.modules.telegram_export.service import (
    TelegramExportGatewayService,
    get_telegram_export_gateway_service,
)

router = APIRouter(
    prefix="/api/v1/telegram",
    tags=["telegram-export"],
)

AUTH_DEPENDENCY = Depends(require_auth)
SERVICE_DEPENDENCY = Depends(get_telegram_export_gateway_service)


@router.post("/export", response_model=TelegramExportStartResponse, status_code=status.HTTP_201_CREATED)
async def start_export(
    request: Request,
    payload: TelegramExportStartRequest,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: TelegramExportGatewayService = SERVICE_DEPENDENCY,
) -> TelegramExportStartResponse:
    request_id, correlation_id = request_ids(request)
    params = {
        "target": payload.target,
        "limit": payload.limit,
        "activeOnly": payload.activeOnly,
        "verifyPhones": payload.verifyPhones,
    }
    return await service.start_export(
        params,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.get("/jobs/{job_id}", response_model=TelegramJobDetailResponse)
async def get_job(
    request: Request,
    job_id: str,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: TelegramExportGatewayService = SERVICE_DEPENDENCY,
) -> TelegramJobDetailResponse:
    request_id, correlation_id = request_ids(request)
    return await service.get_job(
        job_id,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(
    request: Request,
    job_id: str,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: TelegramExportGatewayService = SERVICE_DEPENDENCY,
):
    request_id, correlation_id = request_ids(request)
    return await service.cancel_job(
        job_id,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )


@router.get("/jobs/{job_id}/download/xlsx")
async def download_xlsx(
    request: Request,
    job_id: str,
    auth_claims: dict = AUTH_DEPENDENCY,
    service: TelegramExportGatewayService = SERVICE_DEPENDENCY,
) -> StreamingResponse:
    request_id, correlation_id = request_ids(request)
    data = await service.get_xlsx_bytes(
        job_id,
        user_id=str(auth_claims["sub"]),
        request_id=request_id,
        correlation_id=correlation_id,
    )
    filename = f"telegram_export_{job_id}.xlsx"
    return StreamingResponse(
        iter([data]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(data)),
        },
    )
