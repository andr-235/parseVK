from app.clients.vk_service.client import VkServiceClient
from app.core.security import require_auth
from app.core.utils import request_ids
from app.modules.friends_export.models import (
    FriendsExportStartResponse,
    FriendsJobDetailResponse,
)
from app.modules.friends_export.service import FriendsExportService
from app.modules.vk_friends.adapters import VkFriendsAdapter
from fastapi import APIRouter, Body, Depends, Request

router = APIRouter(
    prefix="/api/v1/vk/friends",
    tags=["vk-friends"],
    dependencies=[Depends(require_auth)],
)


async def get_vk_friends_service(
    request: Request,
    auth_claims: dict = Depends(require_auth),
) -> FriendsExportService:
    user_id = str(auth_claims["sub"])
    request_id, correlation_id = request_ids(request)
    client = VkServiceClient()
    adapter = VkFriendsAdapter(
        client=client,
        user_id=user_id,
        request_id=request_id,
        correlation_id=correlation_id,
    )
    return FriendsExportService(adapter)


@router.post("/export", response_model=FriendsExportStartResponse)
async def start_export(
    payload: dict = Body(...),
    service: FriendsExportService = Depends(get_vk_friends_service),
) -> FriendsExportStartResponse:
    params = payload.get("params") or {}
    return await service.start(params)


@router.get("/jobs/{job_id}", response_model=FriendsJobDetailResponse)
async def get_job(
    job_id: str,
    service: FriendsExportService = Depends(get_vk_friends_service),
) -> FriendsJobDetailResponse:
    return await service.get_job(job_id)


@router.get("/jobs/{job_id}/stream")
async def stream_job(
    job_id: str,
    service: FriendsExportService = Depends(get_vk_friends_service),
):
    return await service.stream(job_id)


@router.get("/jobs/{job_id}/download/xlsx")
async def download_xlsx(
    job_id: str,
    service: FriendsExportService = Depends(get_vk_friends_service),
):
    return await service.download_xlsx(job_id, provider="vk")
