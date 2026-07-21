from __future__ import annotations

from typing import Annotated, Any

from app.modules.monitoring.service import (
    MonitoringGatewayService,
    MonitoringMessagesGatewayService,
    get_monitoring_gateway_service,
    get_monitoring_messages_gateway_service,
)
from fastapi import APIRouter, Body, Depends, Request

router = APIRouter(prefix="/api/v1/monitoring", tags=["monitoring"])


def _to_camel(snake: str) -> str:
    """Convert snake_case to camelCase."""
    parts = snake.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def _transform_group_item(item: dict) -> dict:
    """Transform a single monitoring group item to camelCase keys."""
    mapping = {
        "chat_id": "chatId",
        "created_at": "createdAt",
        "updated_at": "updatedAt",
        "im_group_id": "imGroupId",
    }
    result = {}
    for k, v in item.items():
        new_key = mapping.get(k, _to_camel(k))
        result[new_key] = v
    return result


def _wrap_in_items_response(items: list, total: int | None = None) -> dict:
    """Wrap response in {items, total} format."""
    return {"items": items, "total": total if total is not None else len(items)}


def _transform_group_request(payload: dict[str, Any]) -> dict[str, Any]:
    """Transform a monitoring group request from camelCase to snake_case."""
    body = {k: v for k, v in payload.items() if k not in ("chatId", "imGroupId")}
    if "chatId" in payload:
        body["chat_id"] = payload["chatId"]
    if "imGroupId" in payload:
        body["im_group_id"] = payload["imGroupId"]
    return body


@router.get("/messages")
async def get_messages(
    request: Request,
    service: MonitoringMessagesGatewayService = Depends(get_monitoring_messages_gateway_service),
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
    params = dict(request.query_params)
    # Drop sync param (im-service doesn't support it)
    params.pop("sync", None)
    result = await service.forward_json(
        request,
        "GET",
        "/internal/monitoring/groups",
        params=params,
    )
    if isinstance(result, list):
        items = [_transform_group_item(item) for item in result]
        return _wrap_in_items_response(items)
    return result


@router.post("/groups")
async def create_group(
    request: Request,
    payload: Annotated[dict[str, Any], Body()],
    service: MonitoringGatewayService = Depends(get_monitoring_gateway_service),
):
    body = _transform_group_request(payload)
    result = await service.forward_json(
        request,
        "POST",
        "/internal/monitoring/groups",
        json=body,
    )
    if isinstance(result, dict):
        return _transform_group_item(result)
    return result


@router.patch("/groups/{id:int}")
async def update_group(
    id: int,
    request: Request,
    payload: Annotated[dict[str, Any], Body()],
    service: MonitoringGatewayService = Depends(get_monitoring_gateway_service),
):
    body = _transform_group_request(payload)
    result = await service.forward_json(
        request,
        "PATCH",
        f"/internal/monitoring/groups/{id}",
        json=body,
    )
    if isinstance(result, dict):
        return _transform_group_item(result)
    return result


@router.delete("/groups/{id:int}")
async def delete_group(
    id: int,
    request: Request,
    service: MonitoringGatewayService = Depends(get_monitoring_gateway_service),
):
    result = await service.forward_json(
        request,
        "DELETE",
        f"/internal/monitoring/groups/{id}",
    )
    if isinstance(result, dict) and result.get("deleted"):
        return {"success": True, "id": id}
    return result
