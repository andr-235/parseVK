from typing import Any

from app.modules.listings.constants import LISTING_FIELD_KEYS
from app.modules.listings.helpers import (
    date_value,
    float_value,
    integer_value,
    resolve_source_date,
    resolve_source_string,
    string_value,
)


def sanitize_listing_item(item: Any) -> dict:
    if not isinstance(item, dict):
        raise ValueError("\u044d\u043b\u0435\u043c\u0435\u043d\u0442 \u043d\u0435 \u044f\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u043e\u0431\u044a\u0435\u043a\u0442\u043e\u043c \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u044f")

    result: dict = {}
    extra: dict = {}
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


def build_listing_data(item: dict) -> dict:
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
            [
                image.strip()
                for image in item.get("images", [])
                if isinstance(image, str) and image.strip()
            ]
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
