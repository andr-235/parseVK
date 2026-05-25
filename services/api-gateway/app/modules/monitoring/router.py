from typing import Annotated, Any
from fastapi import APIRouter, Body, Depends, Request

from app.modules.monitoring.service import MonitoringGatewayService, get_monitoring_gateway_service

router = APIRouter(prefix="/api/v1/monitoring", tags=["monitoring"])


@router.get("/messages")
async def get_messages(
    request: Request,
    service: MonitoringGatewayService = Depends(get_monitoring_gateway_service),
):
    return await service.forward_json(
        request,
        "GET",
        "/monitoring/messages",
        params=dict(request.query_params),
    )


@router.get("/groups")
async def get_groups(
    request: Request,
    service: MonitoringGatewayService = Depends(get_monitoring_gateway_service),
):
    return await service.forward_json(
        request,
        "GET",
        "/monitoring/groups",
        params=dict(request.query_params),
    )


@router.post("/groups")
async def create_group(
    request: Request,
    payload: Annotated[dict[str, Any], Body()],
    service: MonitoringGatewayService = Depends(get_monitoring_gateway_service),
):
    return await service.forward_json(
        request,
        "POST",
        "/monitoring/groups",
        json=payload,
    )


@router.patch("/groups/{id:int}")
async def update_group(
    id: int,
    request: Request,
    payload: Annotated[dict[str, Any], Body()],
    service: MonitoringGatewayService = Depends(get_monitoring_gateway_service),
):
    return await service.forward_json(
        request,
        "PATCH",
        f"/monitoring/groups/{id}",
        json=payload,
    )


@router.delete("/groups/{id:int}")
async def delete_group(
    id: int,
    request: Request,
    service: MonitoringGatewayService = Depends(get_monitoring_gateway_service),
):
    return await service.forward_json(
        request,
        "DELETE",
        f"/monitoring/groups/{id}",
    )
