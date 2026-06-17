# ruff: noqa: B008

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from app.modules.telegram_service.repository import TelegramServiceRepository
from app.modules.telegram_service.schemas import (
    TelegramExportStartRequest,
)
from app.modules.telegram_service.service import TelegramServiceService

_repo = TelegramServiceRepository()


def get_repo() -> TelegramServiceRepository:
    return _repo


def get_service(repo: TelegramServiceRepository = Depends(get_repo)) -> TelegramServiceService:
    return TelegramServiceService(repo)


router = APIRouter(prefix="/internal/telegram", tags=["telegram"])


@router.get("/dialogs")
async def get_dialogs(
    service: TelegramServiceService = Depends(get_service),
):
    return await service.get_user_dialogs()


@router.post("/live-parse")
async def start_live_parse(
    params: TelegramExportStartRequest,
    service: TelegramServiceService = Depends(get_service),
):
    return await service.start_live_parse(params.model_dump())


@router.post("/export", status_code=status.HTTP_201_CREATED)
async def start_export(
    params: TelegramExportStartRequest,
    service: TelegramServiceService = Depends(get_service),
):
    return await service.start_export(params.model_dump())


@router.get("/jobs/{job_id}")
async def get_job(
    job_id: uuid.UUID,
    service: TelegramServiceService = Depends(get_service),
):
    result = await service.get_job_detail(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return result


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: uuid.UUID,
    service: TelegramServiceService = Depends(get_service),
):
    success = await service.cancel_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found or already completed")
    return {"status": "cancelled"}


@router.get("/jobs/{job_id}/download/xlsx")
async def download_xlsx(
    job_id: uuid.UUID,
    service: TelegramServiceService = Depends(get_service),
):
    xlsx_bytes = await service.get_xlsx_bytes(job_id)
    if xlsx_bytes is None:
        raise HTTPException(status_code=404, detail="XLSX not found")
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=telegram_export_{job_id}.xlsx"},
    )
