from typing import Annotated
<<<<<<< HEAD
from fastapi import APIRouter, Body, Depends, Query, Request

from app.core.security import require_auth
from app.modules.photo_analysis.service import PhotoAnalysisGatewayService, get_photo_analysis_gateway_service
=======

from app.core.security import require_auth
from app.modules.photo_analysis.service import (
    PhotoAnalysisGatewayService,
    get_photo_analysis_gateway_service,
)
from fastapi import APIRouter, Body, Depends, Request
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

router = APIRouter(
    prefix="/api/v1/photo-analysis",
    tags=["photo-analysis"],
    dependencies=[Depends(require_auth)],
)


@router.post("/vk/{vk_user_id}/analyze")
async def analyze_author_photos(
    vk_user_id: int,
    request: Request,
    payload: Annotated[dict, Body()] = None,
    service: PhotoAnalysisGatewayService = Depends(get_photo_analysis_gateway_service),
):
    return await service.forward(
        request,
        "POST",
        f"/internal/photo-analysis/vk/{vk_user_id}/analyze",
        json=payload or {},
    )


@router.get("/vk/{vk_user_id}")
async def list_author_analyses(
    vk_user_id: int,
    request: Request,
    service: PhotoAnalysisGatewayService = Depends(get_photo_analysis_gateway_service),
):
    return await service.forward(
        request,
        "GET",
        f"/internal/photo-analysis/vk/{vk_user_id}",
    )


@router.get("/vk/{vk_user_id}/suspicious")
async def list_suspicious_analyses(
    vk_user_id: int,
    request: Request,
    service: PhotoAnalysisGatewayService = Depends(get_photo_analysis_gateway_service),
):
    return await service.forward(
        request,
        "GET",
        f"/internal/photo-analysis/vk/{vk_user_id}/suspicious",
    )


@router.get("/vk/{vk_user_id}/summary")
async def get_summary(
    vk_user_id: int,
    request: Request,
    service: PhotoAnalysisGatewayService = Depends(get_photo_analysis_gateway_service),
):
    return await service.forward(
        request,
        "GET",
        f"/internal/photo-analysis/vk/{vk_user_id}/summary",
    )


@router.delete("/vk/{vk_user_id}")
async def delete_analyses(
    vk_user_id: int,
    request: Request,
    service: PhotoAnalysisGatewayService = Depends(get_photo_analysis_gateway_service),
):
    return await service.forward(
        request,
        "DELETE",
        f"/internal/photo-analysis/vk/{vk_user_id}",
    )
