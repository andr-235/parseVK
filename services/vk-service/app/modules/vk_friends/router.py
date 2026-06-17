import os
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.core.security import require_internal_token
from app.modules.vk_friends.schemas import (
    VkFriendsExportStartRequest,
    VkFriendsExportStartResponse,
    VkFriendsJobDetailResponse,
    VkFriendsJobLogEntry,
    VkFriendsJobState,
)
from app.modules.vk_friends.service import VkFriendsExportService

router = APIRouter(
    prefix="/internal/vk/friends",
    tags=["vk-friends"],
    dependencies=[Depends(require_internal_token)],
)


def get_friends_service() -> VkFriendsExportService:
    return VkFriendsExportService()


@router.post("/export", response_model=VkFriendsExportStartResponse, status_code=status.HTTP_201_CREATED)
async def start_export(
    payload: VkFriendsExportStartRequest,
    background_tasks: BackgroundTasks,
    service: VkFriendsExportService = Depends(get_friends_service),
) -> VkFriendsExportStartResponse:
    params = payload.params
    vk_user_id = params.get("user_id")

    # Create job in database
    job = await service.create_job(params, vk_user_id=vk_user_id)

    # Launch processing in background
    background_tasks.add_task(service.run_export_job, job.id, params)

    return VkFriendsExportStartResponse(job_id=str(job.id), status=job.status)


@router.get("/jobs/{job_id}", response_model=VkFriendsJobDetailResponse)
async def get_job(
    job_id: str,
    service: VkFriendsExportService = Depends(get_friends_service),
) -> VkFriendsJobDetailResponse:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job = await service.get_job_by_id(job_uuid)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    logs = await service.get_job_logs(job_uuid, limit=200)

    job_state = VkFriendsJobState(
        id=str(job.id),
        status=job.status,
        fetched_count=job.fetched_count,
        total_count=job.total_count or 0,
        warning=job.warning,
        error=job.error,
        xlsx_path=job.xlsx_path,
        created_at=job.created_at,
    )

    log_entries = [
        VkFriendsJobLogEntry(
            id=str(log.id),
            level=log.level,
            message=log.message,
            meta=log.meta,
            created_at=log.created_at,
        )
        for log in logs
    ]

    return VkFriendsJobDetailResponse(job=job_state, logs=log_entries)


@router.get("/jobs/{job_id}/download/xlsx")
async def download_xlsx(
    job_id: str,
    service: VkFriendsExportService = Depends(get_friends_service),
) -> FileResponse:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job = await service.get_job_by_id(job_uuid)
    if not job or not job.xlsx_path:
        raise HTTPException(status_code=404, detail="XLSX file not found")

    if not os.path.exists(job.xlsx_path):
        raise HTTPException(status_code=404, detail="XLSX file not found on disk")

    filename = f"vk_friends_export_{job_id}.xlsx"
    return FileResponse(
        job.xlsx_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=filename,
    )


@router.get("/jobs/{job_id}/logs/raw")
async def get_raw_logs(
    job_id: str,
    service: VkFriendsExportService = Depends(get_friends_service),
) -> dict:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job = await service.get_job_by_id(job_uuid)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    logs = await service.get_job_logs(job_uuid, limit=500)
    
    # Sort chronologically for gateway SSE event stream
    logs_sorted = sorted(logs, key=lambda l: l.created_at)

    return {
        "job": {
            "id": str(job.id),
            "status": job.status,
            "fetchedCount": job.fetched_count,
            "totalCount": job.total_count or 0,
            "warning": job.warning,
            "error": job.error,
            "xlsxPath": job.xlsx_path,
            "createdAt": job.created_at.isoformat(),
        },
        "logs": [
            {
                "level": log.level,
                "message": log.message,
                "meta": log.meta,
            }
            for log in logs_sorted
        ],
    }
