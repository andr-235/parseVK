from typing import Annotated, Any

from app.modules.listings.service import ListingsGatewayService, get_listings_gateway_service
from fastapi import APIRouter, Body, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/v1", tags=["listings"])


@router.get("/listings")
async def list_listings(
    request: Request,
    service: ListingsGatewayService = Depends(get_listings_gateway_service),
):
    return await service.list_listings(request)


@router.get("/listings/export")
async def export_listings(
    request: Request,
    service: ListingsGatewayService = Depends(get_listings_gateway_service),
):
    return await service.export_listings(request)


@router.patch("/listings/{listing_id:int}")
async def update_listing(
    listing_id: int,
    payload: Annotated[dict[str, Any], Body()],
    request: Request,
    service: ListingsGatewayService = Depends(get_listings_gateway_service),
):
    return await service.update_listing(listing_id, payload, request)


@router.delete("/listings/{listing_id:int}")
async def delete_listing(
    listing_id: int,
    request: Request,
    service: ListingsGatewayService = Depends(get_listings_gateway_service),
):
    return await service.delete_listing(listing_id, request)


@router.post("/data/import")
async def import_data(
    request: Request,
    payload: Annotated[Any | None, Body()] = None,
    service: ListingsGatewayService = Depends(get_listings_gateway_service),
):
    try:
        content_type = request.headers.get("content-type", "")
        if content_type.lower().startswith("multipart/form-data"):
            return await service.import_multipart_request(request)
        return await service.import_json(payload, request)
    except HTTPException as exc:
        if isinstance(exc.detail, dict) and "message" in exc.detail:
            return JSONResponse(status_code=exc.status_code, content=exc.detail)
        raise
