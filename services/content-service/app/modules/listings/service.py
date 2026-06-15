from typing import Any

from fastapi import HTTPException, status

from app.modules.listings.constants import FIELD_TO_COLUMN, MANUAL_FIELDS
from app.modules.listings.csv_export import (
    build_csv_filename,
    format_csv_header,
    format_csv_row,
    parse_csv_fields,
)
from app.modules.listings.helpers import (
    dt,
    string_value,
    integer_value,
    float_value,
    date_value,
    normalize_manual_overrides,
)
from app.modules.listings.import_service import ListingsImportService


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
        self, *, page: int, page_size: int, search: str | None,
        source: str | None, archived: bool | None,
        sort_by: str | None, sort_order: str,
    ) -> dict:
        rows, total, sources = await self.repository.list_listings(
            page=page, page_size=page_size, search=search,
            source=source, archived=archived,
            sort_by=sort_by, sort_order=sort_order,
        )
        return {
            "items": [self.to_dto(row) for row in rows],
            "total": total,
            "page": page,
            "pageSize": page_size,
            "hasMore": (page - 1) * page_size + len(rows) < total,
            "sources": sources,
        }

    async def export_csv(
        self, *, search: str | None, source: str | None,
        archived: bool | None, all: bool, fields: str | None,
    ) -> tuple[str, str]:
        resolved_search = None if all else search
        resolved_source = None if all else source
        resolved_archived = None if all else archived
        rows = await self.repository.find_for_export(
            search=resolved_search, source=resolved_source, archived=resolved_archived,
        )
        selected = parse_csv_fields(fields)
        lines = [format_csv_header(selected)]
        lines.extend(format_csv_row(self.to_dto(row), selected) for row in rows)
        return "\ufeff" + "\n".join(lines) + "\n", build_csv_filename(
            source=resolved_source, export_all=all
        )

    async def update_listing(self, listing_id: int, payload: dict) -> dict:
        existing = await self.repository.find_by_id(listing_id)
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found"
            )
        data = self.build_update_data(payload, existing)
        if data:
            existing = await self.repository.update_listing(listing_id, data)
        return self.to_dto(existing)

    async def delete_listing(self, listing_id: int) -> None:
        deleted = await self.repository.delete_listing(listing_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found"
            )

    async def import_listings(self, payload: Any) -> dict:
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
            return [
                image.strip()
                for image in value or []
                if isinstance(image, str) and image.strip()
            ]
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

    def to_dto(self, row) -> dict:
        return {
            "id": row.id,
            "source": row.source,
            "externalId": row.external_id,
            "title": row.title,
            "description": row.description,
            "url": row.url,
            "price": row.price,
            "currency": row.currency,
            "address": row.address,
            "city": row.city,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "rooms": row.rooms,
            "areaTotal": row.area_total,
            "areaLiving": row.area_living,
            "areaKitchen": row.area_kitchen,
            "floor": row.floor,
            "floorsTotal": row.floors_total,
            "publishedAt": dt(row.published_at),
            "contactName": row.contact_name,
            "contactPhone": row.contact_phone,
            "images": row.images or [],
            "sourceAuthorName": row.source_author_name,
            "sourceAuthorPhone": row.source_author_phone,
            "sourceAuthorUrl": row.source_author_url,
            "sourcePostedAt": dt(row.source_posted_at),
            "sourceParsedAt": dt(row.source_parsed_at),
            "manualOverrides": normalize_manual_overrides(row.manual_overrides),
            "manualNote": row.manual_note,
            "archived": bool(row.archived),
            "createdAt": dt(row.created_at),
            "updatedAt": dt(row.updated_at),
        }
