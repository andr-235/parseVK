from app.modules.listings.constants import FIELD_TO_COLUMN, MANUAL_FIELDS
from app.modules.listings.export_service import export_listings_csv
from app.modules.listings.helpers import (
    date_value,
    float_value,
    integer_value,
    normalize_manual_overrides,
    string_value,
)
from app.modules.listings.import_service import ListingsImportService
from app.modules.listings.schemas import ListingImportPayload, ListingResponse, ListingsListResponse, ListingUpdateRequest
from fastapi import HTTPException, status
from pydantic import ValidationError


class ListingsService:
    def __init__(self, repository):
        self.repository = repository
        self.import_service = ListingsImportService(
            find_by_url=self.repository.find_by_url,
            create_listing=self.repository.create_listing,
            update_by_url=self.repository.update_by_url,
            exclude_manual_overrides_fn=self.exclude_manual_overrides,
        )

    async def list_listings(
        self, *, page, page_size, search, source, archived, sort_by, sort_order,
    ) -> ListingsListResponse:
        rows, total, sources = await self.repository.list_listings(
            page=page, page_size=page_size, search=search, source=source,
            archived=archived, sort_by=sort_by, sort_order=sort_order,
        )
        return ListingsListResponse(
            items=[self.to_dto(row) for row in rows],
            total=total, page=page, pageSize=page_size,
            hasMore=(page - 1) * page_size + len(rows) < total,
            sources=sources,
        )

    async def export_csv(self, *, search, source, archived, all, fields):
        return await export_listings_csv(
            self.repository, search=search, source=source, archived=archived,
            all=all, fields=fields, to_dto=self.to_dto,
        )

    async def update_listing(self, listing_id: int, payload: ListingUpdateRequest) -> ListingResponse:
        existing = await self.repository.find_by_id(listing_id)
        if existing is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
        data = self.build_update_data(payload.model_dump(exclude_unset=True, by_alias=False), existing)
        if data:
            existing = await self.repository.update_listing(listing_id, data)
        return self.to_dto(existing)

    async def delete_listing(self, listing_id: int) -> None:
        deleted = await self.repository.delete_listing(listing_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    async def import_listings(self, payload: ListingImportPayload | dict) -> dict:
        if isinstance(payload, dict):
            try:
                payload = ListingImportPayload.model_validate(payload)
            except ValidationError as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"message": "Данные объявлений содержат ошибки", "errors": [str(e) for e in exc.errors()]},
                )
        return await self.import_service.import_listings(payload)

    def build_update_data(self, payload: dict, existing) -> dict:
        data = {}
        overrides = set(normalize_manual_overrides(existing.manual_overrides))
        for field, column in FIELD_TO_COLUMN.items():
            if field not in payload:
                continue
            value = self.update_value(field, payload[field])
            data[column] = value
            if field in MANUAL_FIELDS:
                overrides.add(field)
        if overrides != set(normalize_manual_overrides(existing.manual_overrides)):
            data["manual_overrides"] = list(overrides)
        return data

    def update_value(self, field: str, value):
        if field in {"price", "rooms", "floor", "floorsTotal"}:
            return integer_value(value)
        if field in {"latitude", "longitude", "areaTotal", "areaLiving", "areaKitchen"}:
            return float_value(value)
        if field in {"publishedAt", "sourceParsedAt"}:
            return date_value(value)
        if field == "images":
            return [image.strip() for image in value or [] if isinstance(image, str) and image.strip()]
        if field == "archived":
            return bool(value)
        return string_value(value)

    def exclude_manual_overrides(self, data: dict, overrides: list[str]) -> dict:
        update = dict(data)
        for field in overrides:
            column = FIELD_TO_COLUMN.get(field)
            if column:
                update.pop(column, None)
        update.pop("manual_overrides", None)
        return update

    def to_dto(self, row) -> ListingResponse:
        return ListingResponse.model_validate(row)
