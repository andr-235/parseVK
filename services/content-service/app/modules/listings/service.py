from datetime import datetime
from typing import Any
from urllib.parse import urlsplit, urlunsplit

from fastapi import HTTPException, status

from app.modules.listings.csv_export import (
    build_csv_filename,
    format_csv_header,
    format_csv_row,
    parse_csv_fields,
)

LISTING_FIELD_KEYS = {
    "url",
    "source",
    "externalId",
    "title",
    "description",
    "price",
    "currency",
    "address",
    "city",
    "latitude",
    "longitude",
    "rooms",
    "areaTotal",
    "areaLiving",
    "areaKitchen",
    "floor",
    "floorsTotal",
    "publishedAt",
    "contactName",
    "contactPhone",
    "images",
    "sourceAuthorName",
    "sourceAuthorPhone",
    "sourceAuthorUrl",
    "sourcePostedAt",
    "sourceParsedAt",
    "metadata",
}

STRING_FIELDS = {
    "source",
    "externalId",
    "title",
    "description",
    "currency",
    "address",
    "city",
    "contactName",
    "contactPhone",
    "sourceAuthorName",
    "sourceAuthorPhone",
    "sourceAuthorUrl",
    "sourcePostedAt",
}

NUMERIC_FIELDS = {
    "price",
    "latitude",
    "longitude",
    "rooms",
    "areaTotal",
    "areaLiving",
    "areaKitchen",
    "floor",
    "floorsTotal",
}

DATE_FIELDS = {"publishedAt", "sourceParsedAt"}

FIELD_TO_COLUMN = {
    "source": "source",
    "externalId": "external_id",
    "title": "title",
    "description": "description",
    "url": "url",
    "price": "price",
    "currency": "currency",
    "address": "address",
    "city": "city",
    "latitude": "latitude",
    "longitude": "longitude",
    "rooms": "rooms",
    "areaTotal": "area_total",
    "areaLiving": "area_living",
    "areaKitchen": "area_kitchen",
    "floor": "floor",
    "floorsTotal": "floors_total",
    "publishedAt": "published_at",
    "contactName": "contact_name",
    "contactPhone": "contact_phone",
    "images": "images",
    "sourceAuthorName": "source_author_name",
    "sourceAuthorPhone": "source_author_phone",
    "sourceAuthorUrl": "source_author_url",
    "sourcePostedAt": "source_posted_at",
    "sourceParsedAt": "source_parsed_at",
    "manualNote": "manual_note",
    "archived": "archived",
}


class ListingsService:
    def __init__(self, repository):
        self.repository = repository

    async def list_listings(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        source: str | None,
        archived: bool | None,
        sort_by: str | None,
        sort_order: str,
    ) -> dict:
        rows, total, sources = await self.repository.list_listings(
            page=page,
            page_size=page_size,
            search=search,
            source=source,
            archived=archived,
            sort_by=sort_by,
            sort_order=sort_order,
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
        self,
        *,
        search: str | None,
        source: str | None,
        archived: bool | None,
        all: bool,
        fields: str | None,
    ) -> tuple[str, str]:
        resolved_search = None if all else search
        resolved_source = None if all else source
        resolved_archived = None if all else archived
        rows = await self.repository.find_for_export(
            search=resolved_search,
            source=resolved_source,
            archived=resolved_archived,
        )
        selected = parse_csv_fields(fields)
        lines = [format_csv_header(selected)]
        lines.extend(format_csv_row(self.to_dto(row), selected) for row in rows)
        return "\ufeff" + "\n".join(lines) + "\n", build_csv_filename(source=resolved_source, export_all=all)

    async def update_listing(self, listing_id: int, payload: dict) -> dict:
        existing = await self.repository.find_by_id(listing_id)
        if existing is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
        data = self.build_update_data(payload, existing)
        if data:
            existing = await self.repository.update_listing(listing_id, data)
        return self.to_dto(existing)

    async def delete_listing(self, listing_id: int) -> None:
        deleted = await self.repository.delete_listing(listing_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    async def import_listings(self, payload: Any) -> dict:
        request = self.normalize_import_payload(payload)
        self.validate_import_items(request["listings"])
        errors = []
        created = updated = skipped = 0

        for index, item in enumerate(request["listings"]):
            try:
                sanitized = self.sanitize_listing_item(item)
                raw_url = self.string_value(sanitized.get("url"))
                if not raw_url:
                    raise ValueError("url обязателен")
                url = normalize_url(raw_url)
                data = self.build_listing_data({**sanitized, "url": url})
                existing = await self.repository.find_by_url(url)
                if existing is not None:
                    if request.get("updateExisting") is False:
                        skipped += 1
                        continue
                    update_data = self.exclude_manual_overrides(data, self.normalize_manual_overrides(existing.manual_overrides))
                    await self.repository.update_by_url(url, update_data)
                    updated += 1
                else:
                    await self.repository.create_listing(data)
                    created += 1
            except Exception as exc:
                skipped += 1
                errors.append(
                    {
                        "index": index,
                        "url": item.get("url") if isinstance(item, dict) and isinstance(item.get("url"), str) else None,
                        "message": str(exc) or "Неизвестная ошибка базы данных",
                    }
                )

        return {
            "processed": len(request["listings"]),
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "failed": len(errors),
            "errors": errors,
        }

    def normalize_import_payload(self, payload: Any) -> dict:
        if isinstance(payload, list):
            payload = {"listings": payload}
        elif isinstance(payload, dict) and "listings" not in payload:
            payload = {"listings": [payload]}
        if not isinstance(payload, dict) or not isinstance(payload.get("listings"), list):
            raise_validation("Неверный формат запроса импорта", ["Ожидался массив объявлений или объект с полем listings"])
        if len(payload["listings"]) == 0:
            raise_validation("Неверный формат запроса импорта", ["listings не может быть пустым"])
        if "updateExisting" in payload and not isinstance(payload["updateExisting"], bool):
            raise_validation("Неверный формат запроса импорта", ["updateExisting должен быть логическим значением"])
        return payload

    def sanitize_listing_item(self, item: Any) -> dict:
        if not isinstance(item, dict):
            raise ValueError("элемент не является объектом объявления")
        result = {}
        extra = {}
        metadata = item.get("metadata") if isinstance(item.get("metadata"), dict) else None
        for key, value in item.items():
            if key == "metadata":
                continue
            if key == "author" and isinstance(value, str) and value.strip():
                result.setdefault("sourceAuthorName", value.strip())
                result.setdefault("contactName", value.strip())
                extra[key] = value.strip()
            elif key == "author_phone" and isinstance(value, str) and value.strip():
                result.setdefault("sourceAuthorPhone", value.strip())
                result.setdefault("contactPhone", value.strip())
                extra[key] = value.strip()
            elif key == "phone" and isinstance(value, str) and value.strip():
                result.setdefault("contactPhone", value.strip())
                extra[key] = value.strip()
            elif key == "author_url" and isinstance(value, str) and value.strip():
                result.setdefault("sourceAuthorUrl", value.strip())
                extra[key] = value.strip()
            elif key in {"posted_at", "postedAt"} and isinstance(value, str) and value.strip():
                result.setdefault("sourcePostedAt", value.strip())
                extra[key] = value.strip()
            elif key in {"parsed_at", "parsedAt"} and isinstance(value, str) and value.strip():
                if self.date_value(value) is not None:
                    result.setdefault("sourceParsedAt", value.strip())
                extra[key] = value.strip()
            elif key in LISTING_FIELD_KEYS:
                result[key] = value
            else:
                extra[key] = value
        if metadata is not None or extra:
            result["metadata"] = {**(metadata or {}), **extra}
        return result

    def validate_import_items(self, listings: list[Any]) -> None:
        item_errors: list[str] = []
        for index, item in enumerate(listings):
            errors = self.validate_import_item(item)
            if errors:
                item_errors.append(f"Элемент {index}: {'; '.join(errors)}")
        if item_errors:
            raise_validation("Данные объявлений содержат ошибки", item_errors)

    def validate_import_item(self, item: Any) -> list[str]:
        if not isinstance(item, dict):
            return ["элемент не является объектом объявления"]

        errors: list[str] = []
        allowed_fields = LISTING_FIELD_KEYS | {
            "author",
            "author_phone",
            "phone",
            "author_url",
            "posted_at",
            "postedAt",
            "parsed_at",
            "parsedAt",
        }
        for key, value in item.items():
            if key not in allowed_fields:
                continue
            if value is None:
                continue
            if key == "url":
                if not isinstance(value, str) or not value.strip():
                    errors.append("url обязателен")
            elif key in STRING_FIELDS or key in {"author", "author_phone", "phone", "author_url", "posted_at", "postedAt", "parsed_at", "parsedAt"}:
                if not isinstance(value, str):
                    errors.append(f"{key} должен быть строкой")
            elif key in NUMERIC_FIELDS:
                if not isinstance(value, (str, int, float)):
                    errors.append(f"{key} должен быть строкой или числом")
            elif key in DATE_FIELDS:
                if not isinstance(value, str) or self.date_value(value) is None:
                    errors.append(f"{key} должен быть датой в формате ISO")
            elif key == "images":
                if not isinstance(value, list):
                    errors.append("images должен быть массивом строк")
                elif any(not isinstance(image, str) for image in value):
                    errors.append("каждый элемент images должен быть строкой")
            elif key == "metadata":
                if not isinstance(value, dict):
                    errors.append("metadata должен быть объектом")
        return errors

    def build_listing_data(self, item: dict) -> dict:
        metadata = item.get("metadata") if isinstance(item.get("metadata"), dict) else None
        return {
            "url": item["url"].strip(),
            "source": self.string_value(item.get("source")),
            "external_id": self.string_value(item.get("externalId")),
            "title": self.string_value(item.get("title")),
            "description": self.string_value(item.get("description")),
            "price": self.integer_value(item.get("price")),
            "currency": self.string_value(item.get("currency")),
            "address": self.string_value(item.get("address")),
            "city": self.string_value(item.get("city")),
            "latitude": self.float_value(item.get("latitude")),
            "longitude": self.float_value(item.get("longitude")),
            "rooms": self.integer_value(item.get("rooms")),
            "area_total": self.float_value(item.get("areaTotal")),
            "area_living": self.float_value(item.get("areaLiving")),
            "area_kitchen": self.float_value(item.get("areaKitchen")),
            "floor": self.integer_value(item.get("floor")),
            "floors_total": self.integer_value(item.get("floorsTotal")),
            "published_at": self.date_value(item.get("publishedAt")),
            "contact_name": self.string_value(item.get("contactName")),
            "contact_phone": self.string_value(item.get("contactPhone")),
            "images": [image.strip() for image in item.get("images", []) if isinstance(image, str) and image.strip()]
            if isinstance(item.get("images"), list)
            else [],
            "source_author_name": self.resolve_source_string(item.get("sourceAuthorName"), metadata, ["author", "author_name", "contact_name", "contactName"]),
            "source_author_phone": self.resolve_source_string(item.get("sourceAuthorPhone"), metadata, ["author_phone", "contact_phone", "phone"]),
            "source_author_url": self.resolve_source_string(item.get("sourceAuthorUrl"), metadata, ["author_url", "url"]),
            "source_posted_at": self.resolve_source_string(item.get("sourcePostedAt"), metadata, ["posted_at", "postedAt", "published_at", "publishedAt"]),
            "source_parsed_at": self.resolve_source_date(item.get("sourceParsedAt"), metadata, ["parsed_at", "parsedAt"]),
            "manual_overrides": [],
            "archived": False,
        }

    def build_update_data(self, payload: dict, existing) -> dict:
        data = {}
        overrides = set(self.normalize_manual_overrides(existing.manual_overrides))
        manual_fields = {"title", "description", "price", "currency", "address", "city", "contactName", "contactPhone"}
        for field, column in FIELD_TO_COLUMN.items():
            if field not in payload:
                continue
            value = self.update_value(field, payload[field])
            data[column] = value
            if field in manual_fields:
                overrides.add(field)
        if overrides != set(self.normalize_manual_overrides(existing.manual_overrides)):
            data["manual_overrides"] = list(overrides)
        return data

    def update_value(self, field: str, value):
        if field in {"price", "rooms", "floor", "floorsTotal"}:
            return self.integer_value(value)
        if field in {"latitude", "longitude", "areaTotal", "areaLiving", "areaKitchen"}:
            return self.float_value(value)
        if field in {"publishedAt", "sourceParsedAt"}:
            return self.date_value(value)
        if field == "images":
            return [image.strip() for image in value or [] if isinstance(image, str) and image.strip()]
        if field == "archived":
            return bool(value)
        return self.string_value(value)

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
            "manualOverrides": self.normalize_manual_overrides(row.manual_overrides),
            "manualNote": row.manual_note,
            "archived": bool(row.archived),
            "createdAt": dt(row.created_at),
            "updatedAt": dt(row.updated_at),
        }

    def normalize_manual_overrides(self, value: Any) -> list[str]:
        return [item.strip() for item in value if isinstance(item, str) and item.strip()] if isinstance(value, list) else []

    def resolve_source_string(self, direct, metadata, keys):
        direct_value = self.string_value(direct)
        if direct_value is not None:
            return direct_value
        if not metadata:
            return None
        for key in keys:
            value = self.string_value(metadata.get(key))
            if value is not None:
                return value
        return None

    def resolve_source_date(self, direct, metadata, keys):
        parsed = self.date_value(direct)
        if parsed is not None:
            return parsed
        if not metadata:
            return None
        for key in keys:
            parsed = self.date_value(metadata.get(key))
            if parsed is not None:
                return parsed
        return None

    def string_value(self, value) -> str | None:
        if not isinstance(value, str):
            return None
        stripped = value.strip()
        return stripped or None

    def integer_value(self, value) -> int | None:
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return round(value) if value == value else None
        digits = "".join(char for char in str(value) if char.isdigit())
        return round(float(digits)) if digits else None

    def float_value(self, value) -> float | None:
        if value is None:
            return None
        try:
            number = float(str(value).replace(" ", "").replace(",", "."))
            return number if number == number else None
        except ValueError:
            return None

    def date_value(self, value) -> datetime | None:
        if not isinstance(value, str) or not value.strip():
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None


def normalize_url(value: str) -> str:
    parsed = urlsplit(value.strip())
    if not parsed.scheme or not parsed.netloc:
        raise ValueError("Некорректный формат URL")
    path = "/" + "/".join(part for part in parsed.path.split("/") if part)
    if path == "/":
        path = parsed.path or "/"
    return urlunsplit((parsed.scheme.lower(), parsed.netloc.lower(), path.rstrip("/") if len(path) > 1 else path, "", ""))


def raise_validation(message: str, errors: list[str]):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"message": message, "errors": errors})


def dt(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, str):
        return value
    return None
