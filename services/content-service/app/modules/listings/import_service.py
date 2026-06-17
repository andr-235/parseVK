from __future__ import annotations

from collections.abc import Callable, Coroutine
from typing import Any

from app.modules.listings.constants import (
    DATE_FIELDS,
    LISTING_FIELD_KEYS,
    NUMERIC_FIELDS,
    STRING_FIELDS,
)
from app.modules.listings.helpers import (
    date_value,
    float_value,
    integer_value,
    normalize_manual_overrides,
    normalize_url,
    raise_validation,
    resolve_source_date,
    resolve_source_string,
    string_value,
)


class ListingsImportService:
    def __init__(
        self,
        find_by_url: Callable[[str], Coroutine],
        create_listing: Callable[[dict], Coroutine],
        update_by_url: Callable[[str, dict], Coroutine],
        exclude_manual_overrides_fn: Callable[[dict, list[str]], dict],
    ):
        self._find_by_url = find_by_url
        self._create_listing = create_listing
        self._update_by_url = update_by_url
        self._exclude_manual_overrides = exclude_manual_overrides_fn

    async def import_listings(self, payload: Any) -> dict:
        request = self.normalize_import_payload(payload)
        self.validate_import_items(request["listings"])
        errors = []
        created = updated = skipped = 0

        for index, item in enumerate(request["listings"]):
            try:
                sanitized = self.sanitize_listing_item(item)
                raw_url = string_value(sanitized.get("url"))
                if not raw_url:
                    raise ValueError("url \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d")
                url = normalize_url(raw_url)
                data = self.build_listing_data({**sanitized, "url": url})
                existing = await self._find_by_url(url)
                if existing is not None:
                    if request.get("updateExisting") is False:
                        skipped += 1
                        continue
                    update_data = self._exclude_manual_overrides(
                        data, normalize_manual_overrides(existing.manual_overrides)
                    )
                    await self._update_by_url(url, update_data)
                    updated += 1
                else:
                    await self._create_listing(data)
                    created += 1
            except Exception as exc:
                skipped += 1
                errors.append(
                    {
                        "index": index,
                        "url": (
                            item.get("url")
                            if isinstance(item, dict) and isinstance(item.get("url"), str)
                            else None
                        ),
                        "message": str(exc) or "\u041d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u0430\u044f \u043e\u0448\u0438\u0431\u043a\u0430 \u0431\u0430\u0437\u044b \u0434\u0430\u043d\u043d\u044b\u0445",
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
            raise_validation(
                "\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0444\u043e\u0440\u043c\u0430\u0442 \u0437\u0430\u043f\u0440\u043e\u0441\u0430 \u0438\u043c\u043f\u043e\u0440\u0442\u0430",
                ["\u041e\u0436\u0438\u0434\u0430\u043b\u0441\u044f \u043c\u0430\u0441\u0441\u0438\u0432 \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u0439 \u0438\u043b\u0438 \u043e\u0431\u044a\u0435\u043a\u0442 \u0441 \u043f\u043e\u043b\u0435\u043c listings"],
            )
        if len(payload["listings"]) == 0:
            raise_validation(
                "\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0444\u043e\u0440\u043c\u0430\u0442 \u0437\u0430\u043f\u0440\u043e\u0441\u0430 \u0438\u043c\u043f\u043e\u0440\u0442\u0430",
                ["listings \u043d\u0435 \u043c\u043e\u0436\u0435\u0442 \u0431\u044b\u0442\u044c \u043f\u0443\u0441\u0442\u044b\u043c"],
            )
        if "updateExisting" in payload and not isinstance(payload["updateExisting"], bool):
            raise_validation(
                "\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0444\u043e\u0440\u043c\u0430\u0442 \u0437\u0430\u043f\u0440\u043e\u0441\u0430 \u0438\u043c\u043f\u043e\u0440\u0442\u0430",
                ["updateExisting \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043b\u043e\u0433\u0438\u0447\u0435\u0441\u043a\u0438\u043c \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435\u043c"],
            )
        return payload

    def sanitize_listing_item(self, item: Any) -> dict:
        if not isinstance(item, dict):
            raise ValueError("\u044d\u043b\u0435\u043c\u0435\u043d\u0442 \u043d\u0435 \u044f\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u043e\u0431\u044a\u0435\u043a\u0442\u043e\u043c \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u044f")

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
                if date_value(value) is not None:
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
                item_errors.append(
                    f"\u042d\u043b\u0435\u043c\u0435\u043d\u0442 {index}: {'; '.join(errors)}"
                )
        if item_errors:
            raise_validation(
                "\u0414\u0430\u043d\u043d\u044b\u0435 \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u0439 \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442 \u043e\u0448\u0438\u0431\u043a\u0438",
                item_errors,
            )

    def validate_import_item(self, item: Any) -> list[str]:
        if not isinstance(item, dict):
            return ["\u044d\u043b\u0435\u043c\u0435\u043d\u0442 \u043d\u0435 \u044f\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u043e\u0431\u044a\u0435\u043a\u0442\u043e\u043c \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u044f"]

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
                    errors.append("url \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d")
            elif key in STRING_FIELDS or key in {
                "author", "author_phone", "phone", "author_url",
                "posted_at", "postedAt", "parsed_at", "parsedAt",
            }:
                if not isinstance(value, str):
                    errors.append(f"{key} \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u0441\u0442\u0440\u043e\u043a\u043e\u0439")
            elif key in NUMERIC_FIELDS:
                if not isinstance(value, (str, int, float)):
                    errors.append(f"{key} \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u0441\u0442\u0440\u043e\u043a\u043e\u0439 \u0438\u043b\u0438 \u0447\u0438\u0441\u043b\u043e\u043c")
            elif key in DATE_FIELDS:
                if not isinstance(value, str) or date_value(value) is None:
                    errors.append(f"{key} \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u0434\u0430\u0442\u043e\u0439 \u0432 \u0444\u043e\u0440\u043c\u0430\u0442\u0435 ISO")
            elif key == "images":
                if not isinstance(value, list):
                    errors.append("images \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043c\u0430\u0441\u0441\u0438\u0432\u043e\u043c \u0441\u0442\u0440\u043e\u043a")
                elif any(not isinstance(image, str) for image in value):
                    errors.append("\u043a\u0430\u0436\u0434\u044b\u0439 \u044d\u043b\u0435\u043c\u0435\u043d\u0442 images \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u0441\u0442\u0440\u043e\u043a\u043e\u0439")
            elif key == "metadata":
                if not isinstance(value, dict):
                    errors.append("metadata \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043e\u0431\u044a\u0435\u043a\u0442\u043e\u043c")
        return errors

    def build_listing_data(self, item: dict) -> dict:
        metadata = item.get("metadata") if isinstance(item.get("metadata"), dict) else None
        return {
            "url": item["url"].strip(),
            "source": string_value(item.get("source")),
            "external_id": string_value(item.get("externalId")),
            "title": string_value(item.get("title")),
            "description": string_value(item.get("description")),
            "price": integer_value(item.get("price")),
            "currency": string_value(item.get("currency")),
            "address": string_value(item.get("address")),
            "city": string_value(item.get("city")),
            "latitude": float_value(item.get("latitude")),
            "longitude": float_value(item.get("longitude")),
            "rooms": integer_value(item.get("rooms")),
            "area_total": float_value(item.get("areaTotal")),
            "area_living": float_value(item.get("areaLiving")),
            "area_kitchen": float_value(item.get("areaKitchen")),
            "floor": integer_value(item.get("floor")),
            "floors_total": integer_value(item.get("floorsTotal")),
            "published_at": date_value(item.get("publishedAt")),
            "contact_name": string_value(item.get("contactName")),
            "contact_phone": string_value(item.get("contactPhone")),
            "images": (
                [image.strip() for image in item.get("images", []) if isinstance(image, str) and image.strip()]
                if isinstance(item.get("images"), list)
                else []
            ),
            "source_author_name": resolve_source_string(
                item.get("sourceAuthorName"), metadata,
                ["author", "author_name", "contact_name", "contactName"],
            ),
            "source_author_phone": resolve_source_string(
                item.get("sourceAuthorPhone"), metadata,
                ["author_phone", "contact_phone", "phone"],
            ),
            "source_author_url": resolve_source_string(
                item.get("sourceAuthorUrl"), metadata,
                ["author_url", "url"],
            ),
            "source_posted_at": resolve_source_string(
                item.get("sourcePostedAt"), metadata,
                ["posted_at", "postedAt", "published_at", "publishedAt"],
            ),
            "source_parsed_at": resolve_source_date(
                item.get("sourceParsedAt"), metadata,
                ["parsed_at", "parsedAt"],
            ),
            "manual_overrides": [],
            "archived": False,
        }
