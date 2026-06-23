import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.telegram_service.schemas import (
    TelegramExportStartResponse,
    TelegramJobDetailResponse,
    TelegramJobLogEntry,
    TelegramJobState,
)
from app.modules.telegram_service.service import TelegramServiceService
from app.modules.telegram_service.repository import TelegramServiceRepository

router = APIRouter(
    prefix="/internal/telegram",
    tags=["telegram"],
    dependencies=[Depends(require_internal_token)],
)


def get_service(session: AsyncSession = Depends(get_session)) -> TelegramServiceService:
    repo = TelegramServiceRepository(session)
    return TelegramServiceService(repo)


@router.get("/dialogs")
async def get_dialogs(
    service: TelegramServiceService = Depends(get_service),
) -> list[dict]:
    return await service.get_user_dialogs()


@router.post(
    "/export", response_model=TelegramExportStartResponse, status_code=status.HTTP_201_CREATED
)
async def start_export(
    params: dict,
    service: TelegramServiceService = Depends(get_service),
) -> TelegramExportStartResponse:
    return await service.start_export(params)


@router.post(
    "/live-parse", response_model=TelegramExportStartResponse, status_code=status.HTTP_201_CREATED
)
async def start_live_parse(
    params: dict,
    service: TelegramServiceService = Depends(get_service),
) -> TelegramExportStartResponse:
    return await service.start_live_parse(params)


@router.get("/jobs/{job_id}", response_model=TelegramJobDetailResponse)
async def get_job(
    job_id: str,
    service: TelegramServiceService = Depends(get_service),
) -> TelegramJobDetailResponse:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    result = await service.get_job_detail(job_uuid)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    return result


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    service: TelegramServiceService = Depends(get_service),
) -> dict:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    cancelled = await service.cancel_job(job_uuid)
    if not cancelled:
        raise HTTPException(status_code=404, detail="Job not found or already finished")
    return {"status": "cancelled"}


@router.get("/jobs/{job_id}/download/xlsx")
async def download_xlsx(
    job_id: str,
    service: TelegramServiceService = Depends(get_service),
) -> Response:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    xlsx_bytes = await service.get_xlsx_bytes(job_uuid)
    if not xlsx_bytes:
        raise HTTPException(status_code=404, detail="XLSX file not found")

    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="telegram_export_{job_id}.xlsx"'},
    )
