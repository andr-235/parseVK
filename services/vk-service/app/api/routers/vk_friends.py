import uuid

from anyio import Path as AsyncPath
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_vk_friends_repository_dep
from app.api.schemas.vk_friends import (
    VkFriendsExportStartRequest,
    VkFriendsExportStartResponse,
    VkFriendsJobDetailResponse,
    VkFriendsJobLogEntry,
    VkFriendsJobState,
)
from app.core.security import require_internal_token
from app.domain.repositories.vk_friends import VkFriendsRepository
from app.infrastructure.db.session import get_session

router = APIRouter(
    prefix="/internal/vk/friends",
    tags=["vk-friends"],
    dependencies=[Depends(require_internal_token)],
)


async def run_export_job_background(job_id: uuid.UUID, params: dict) -> None:
    import asyncio

    from app.bootstrap import (
        get_provider_account_repository,
        get_vk_client,
        get_vk_friends_service,
    )
    from app.infrastructure.db.session import SessionLocal
    from app.tasks.vk_client_binding import bind_system_vk_client

    await asyncio.sleep(0.1)
    async with SessionLocal() as session:
        async with session.begin():
            client = await bind_system_vk_client(
                get_vk_client(),
                get_provider_account_repository,
                session,
                f"friends-export:{job_id}",
            )
            service = get_vk_friends_service(session, adapter=client)
            await service.run_export_job(job_id, params)


@router.post(
    "/export",
    response_model=VkFriendsExportStartResponse,
    status_code=status.HTTP_201_CREATED,
)
async def start_export(
    payload: VkFriendsExportStartRequest,
    background_tasks: BackgroundTasks,
    repo: VkFriendsRepository = Depends(get_vk_friends_repository_dep),
    session: AsyncSession = Depends(get_session),
) -> VkFriendsExportStartResponse:
    params = payload.params
    vk_user_id = params.get("user_id")
    job = await repo.create_job(params, vk_user_id=vk_user_id)
    await session.commit()
    background_tasks.add_task(run_export_job_background, job.id, params)
    return VkFriendsExportStartResponse(job_id=str(job.id), status=job.status)


@router.get("/jobs/{job_id}", response_model=VkFriendsJobDetailResponse)
async def get_job(
    job_id: str,
    repo: VkFriendsRepository = Depends(get_vk_friends_repository_dep),
) -> VkFriendsJobDetailResponse:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid job ID format") from error

    job = await repo.get_job_by_id(job_uuid)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    logs = await repo.get_job_logs(job_uuid, limit=200)
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
    repo: VkFriendsRepository = Depends(get_vk_friends_repository_dep),
) -> FileResponse:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid job ID format") from error

    job = await repo.get_job_by_id(job_uuid)
    if not job or not job.xlsx_path:
        raise HTTPException(status_code=404, detail="XLSX file not found")
    if not await AsyncPath(job.xlsx_path).exists():
        raise HTTPException(status_code=404, detail="XLSX file not found")

    return FileResponse(
        job.xlsx_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"vk_friends_export_{job_id}.xlsx",
    )


@router.get("/jobs/{job_id}/logs/raw")
async def get_raw_logs(
    job_id: str,
    repo: VkFriendsRepository = Depends(get_vk_friends_repository_dep),
) -> dict:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid job ID format") from error

    job = await repo.get_job_by_id(job_uuid)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    logs = await repo.get_job_logs(job_uuid, limit=500)
    logs_sorted = sorted(logs, key=lambda log_item: log_item.created_at)
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
