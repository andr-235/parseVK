from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import JSONResponse, PlainTextResponse

from app.core.security import require_internal_token
from app.modules.listings.dependencies import get_listings_service
from app.modules.listings.service import ListingsService

router = APIRouter(
    prefix="/internal/content",
    tags=["listings"],
    dependencies=[Depends(require_internal_token)],
)



@router.get("/listings")
async def list_listings(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100, alias="pageSize"),
    search: str | None = Query(default=None),
    source: str | None = Query(default=None),
    archived: bool | None = Query(default=None),
    sort_by: str | None = Query(default=None, alias="sortBy"),
    sort_order: str = Query(default="asc", alias="sortOrder"),
    service: ListingsService = Depends(get_listings_service),
):
    return await service.list_listings(
        page=page,
        page_size=page_size,
        search=normalize_text(search),
        source=normalize_source(source),
        archived=archived,
        sort_by=sort_by,
        sort_order=sort_order if sort_order in {"asc", "desc"} else "asc",
    )


@router.get("/listings/export")
async def export_listings(
    search: str | None = Query(default=None),
    source: str | None = Query(default=None),
    archived: bool | None = Query(default=None),
    all: bool = Query(default=False),
    fields: str | None = Query(default=None),
    service: ListingsService = Depends(get_listings_service),
):
    content, filename = await service.export_csv(
        search=normalize_text(search),
        source=normalize_source(source),
        archived=archived,
        all=all,
        fields=fields,
    )
    return PlainTextResponse(
        content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.patch("/listings/{listing_id:int}")
async def update_listing(
    listing_id: int,
    payload: dict[str, Any],
    service: ListingsService = Depends(get_listings_service),
):
    return await service.update_listing(listing_id, payload)


@router.delete("/listings/{listing_id:int}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: int,
    service: ListingsService = Depends(get_listings_service),
):
    await service.delete_listing(listing_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/data/import")
async def import_data(
    request: Request,
    service: ListingsService = Depends(get_listings_service),
):
    try:
        payload = await request.json()
        if isinstance(payload, list):
            payload = {"listings": payload}
        elif isinstance(payload, dict) and "listings" not in payload:
            payload = {"listings": [payload]}
        return await service.import_listings(payload)
    except HTTPException as exc:
        if isinstance(exc.detail, dict) and "message" in exc.detail:
            return JSONResponse(status_code=exc.status_code, content=exc.detail)
        raise


def normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def normalize_source(value: str | None) -> str | None:
    normalized = normalize_text(value)
    return None if normalized is None or normalized.lower() == "all" else normalized
