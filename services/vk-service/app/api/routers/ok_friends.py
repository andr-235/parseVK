import os
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.api.dependencies import get_ok_friends_repository_dep
from app.api.schemas.ok_friends import (
    OkFriendsExportStartRequest,
    OkFriendsExportStartResponse,
    OkFriendsJobDetailResponse,
    OkFriendsJobLogEntry,
    OkFriendsJobState,
)
from app.core.security import require_internal_token
from app.domain.repositories.ok_friends import OkFriendsRepository

router = APIRouter(
    prefix="/internal/ok/friends",
    tags=["ok-friends"],
    dependencies=[Depends(require_internal_token)],
)

async def run_export_job_background(job_id: uuid.UUID, params: dict) -> None:
    import asyncio
    await asyncio.sleep(0.1)  # Allow API request transaction to commit and release SQLite lock
    from app.bootstrap import get_ok_friends_service
    from app.infrastructure.db.session import SessionLocal
    async with SessionLocal() as session:
        service = get_ok_friends_service(session)
        await service.run_export_job(job_id, params)

@router.post("/export", response_model=OkFriendsExportStartResponse, status_code=status.HTTP_201_CREATED)
async def start_export(
    payload: OkFriendsExportStartRequest,
    background_tasks: BackgroundTasks,
    repo: OkFriendsRepository = Depends(get_ok_friends_repository_dep),
) -> OkFriendsExportStartResponse:
    params = payload.params
    fid_raw = params.get("fid")
    ok_user_id = None
    if fid_raw:
        try:
            ok_user_id = int(fid_raw)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid OK user ID (fid) format, must be numeric string")

    # Create job in database
    job = await repo.create_job(params, ok_user_id=ok_user_id)

    # Launch processing in background
    background_tasks.add_task(run_export_job_background, job.id, params)

    return OkFriendsExportStartResponse(job_id=str(job.id), status=job.status)

@router.get("/jobs/{job_id}", response_model=OkFriendsJobDetailResponse)
async def get_job(
    job_id: str,
    repo: OkFriendsRepository = Depends(get_ok_friends_repository_dep),
) -> OkFriendsJobDetailResponse:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job = await repo.get_job_by_id(job_uuid)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    logs = await repo.get_job_logs(job_uuid, limit=200)

    job_state = OkFriendsJobState(
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
        OkFriendsJobLogEntry(
            id=str(log.id),
            level=log.level,
            message=log.message,
            meta=log.meta,
            created_at=log.created_at,
        )
        for log in logs
    ]

    return OkFriendsJobDetailResponse(job=job_state, logs=log_entries)

@router.get("/jobs/{job_id}/download/xlsx")
async def download_xlsx(
    job_id: str,
    repo: OkFriendsRepository = Depends(get_ok_friends_repository_dep),
) -> FileResponse:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job = await repo.get_job_by_id(job_uuid)
    if not job or not job.xlsx_path:
        raise HTTPException(status_code=404, detail="XLSX file not found")

    if not os.path.exists(job.xlsx_path):
        raise HTTPException(status_code=404, detail="XLSX file not found on disk")

    filename = f"ok_friends_export_{job_id}.xlsx"
    return FileResponse(
        job.xlsx_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=filename,
    )

@router.get("/jobs/{job_id}/logs/raw")
async def get_raw_logs(
    job_id: str,
    repo: OkFriendsRepository = Depends(get_ok_friends_repository_dep),
) -> dict:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job = await repo.get_job_by_id(job_uuid)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    logs = await repo.get_job_logs(job_uuid, limit=500)
    
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
