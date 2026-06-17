from typing import Any

from app.modules.listings.constants import (
    DATE_FIELDS,
    LISTING_FIELD_KEYS,
    NUMERIC_FIELDS,
    STRING_FIELDS,
)
from app.modules.listings.helpers import date_value, raise_validation

_ALIAS_FIELDS = {
    "author",
    "author_phone",
    "phone",
    "author_url",
    "posted_at",
    "postedAt",
    "parsed_at",
    "parsedAt",
}


def validate_import_item(item: Any) -> list[str]:
    if not isinstance(item, dict):
        return ["\u044d\u043b\u0435\u043c\u0435\u043d\u0442 \u043d\u0435 \u044f\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u043e\u0431\u044a\u0435\u043a\u0442\u043e\u043c \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u044f"]

    errors: list[str] = []
    allowed_fields = LISTING_FIELD_KEYS | _ALIAS_FIELDS
    for key, value in item.items():
        if key not in allowed_fields:
            continue
        if value is None:
            continue
        if key == "url":
            if not isinstance(value, str) or not value.strip():
                errors.append("url \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d")
        elif key in STRING_FIELDS or key in _ALIAS_FIELDS:
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
            elif any(not isinstance(img, str) for img in value):
                errors.append("\u043a\u0430\u0436\u0434\u044b\u0439 \u044d\u043b\u0435\u043c\u0435\u043d\u0442 images \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u0441\u0442\u0440\u043e\u043a\u043e\u0439")
        elif key == "metadata":
            if not isinstance(value, dict):
                errors.append("metadata \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043e\u0431\u044a\u0435\u043a\u0442\u043e\u043c")
    return errors


def validate_import_items(listings: list[Any]) -> None:
    item_errors: list[str] = []
    for index, item in enumerate(listings):
        errors = validate_import_item(item)
        if errors:
            item_errors.append(f"\u042d\u043b\u0435\u043c\u0435\u043d\u0442 {index}: {'; '.join(errors)}")
    if item_errors:
        raise_validation("\u0414\u0430\u043d\u043d\u044b\u0435 \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u0439 \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442 \u043e\u0448\u0438\u0431\u043a\u0438", item_errors)
