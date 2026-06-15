from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.photo_analysis.schemas import (
    AnalyzePhotosSchema,
    PhotoAnalysisListSchema,
    PhotoAnalysisSummarySchema,
    BulkSummariesRequestSchema,
)
from app.modules.photo_analysis.service import PhotoAnalysisService

router = APIRouter(
    prefix="/internal/photo-analysis",
    tags=["photo-analysis"],
    dependencies=[Depends(require_internal_token)],
)


async def get_photo_analysis_service(session: AsyncSession = Depends(get_session)) -> PhotoAnalysisService:
    return PhotoAnalysisService(session)


@router.post("/vk/{vk_user_id}/analyze", response_model=PhotoAnalysisListSchema)
async def analyze_author_photos(
    vk_user_id: int,
    payload: AnalyzePhotosSchema,
    service: PhotoAnalysisService = Depends(get_photo_analysis_service),
):
    return await service.analyze_by_vk_user(vk_user_id, payload)


@router.get("/vk/{vk_user_id}", response_model=PhotoAnalysisListSchema)
async def list_author_analyses(
    vk_user_id: int,
    service: PhotoAnalysisService = Depends(get_photo_analysis_service),
):
    return await service.list_by_vk_user(vk_user_id)


@router.get("/vk/{vk_user_id}/suspicious", response_model=PhotoAnalysisListSchema)
async def list_suspicious_analyses(
    vk_user_id: int,
    service: PhotoAnalysisService = Depends(get_photo_analysis_service),
):
    return await service.list_suspicious_by_vk_user(vk_user_id)


@router.get("/vk/{vk_user_id}/summary", response_model=PhotoAnalysisSummarySchema)
async def get_summary(
    vk_user_id: int,
    service: PhotoAnalysisService = Depends(get_photo_analysis_service),
):
    return await service.get_summary_by_vk_user(vk_user_id)


@router.delete("/vk/{vk_user_id}")
async def delete_analyses(
    vk_user_id: int,
    service: PhotoAnalysisService = Depends(get_photo_analysis_service),
):
    await service.delete_by_vk_user(vk_user_id)
    return {"message": "Analyses deleted successfully"}


@router.post("/bulk-summaries", response_model=dict[int, PhotoAnalysisSummarySchema])
async def get_bulk_summaries(
    payload: BulkSummariesRequestSchema,
    service: PhotoAnalysisService = Depends(get_photo_analysis_service),
):
    return await service.get_bulk_summaries(payload.vk_author_ids)
