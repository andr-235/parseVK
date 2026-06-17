from datetime import datetime
from urllib.parse import urlsplit, urlunsplit

from fastapi import HTTPException, status


def normalize_url(value: str) -> str:
    parsed = urlsplit(value.strip())
    if not parsed.scheme or not parsed.netloc:
        raise ValueError("\u041d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 \u0444\u043e\u0440\u043c\u0430\u0442 URL")
    path = "/" + "/".join(part for part in parsed.path.split("/") if part)
    if path == "/":
        path = parsed.path or "/"
    return urlunsplit(
        (
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            path.rstrip("/") if len(path) > 1 else path,
            "",
            "",
        )
    )


def raise_validation(message: str, errors: list[str]):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"message": message, "errors": errors},
    )


def dt(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, str):
        return value
    return None


def string_value(value) -> str | None:
    if not isinstance(value, str):
        return None
    stripped = value.strip()
    return stripped or None


def integer_value(value) -> int | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return round(value) if value == value else None
    digits = "".join(char for char in str(value) if char.isdigit())
    return round(float(digits)) if digits else None


def float_value(value) -> float | None:
    if value is None:
        return None
    try:
        number = float(str(value).replace(" ", "").replace(",", "."))
        return number if number == number else None
    except ValueError:
        return None


def date_value(value) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def normalize_manual_overrides(value) -> list[str]:
    if isinstance(value, list):
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]
    return []


def resolve_source_string(direct, metadata, keys):
    direct_result = string_value(direct)
    if direct_result is not None:
        return direct_result
    if not metadata:
        return None
    for key in keys:
        result = string_value(metadata.get(key))
        if result is not None:
            return result
    return None


def resolve_source_date(direct, metadata, keys):
    parsed = date_value(direct)
    if parsed is not None:
        return parsed
    if not metadata:
        return None
    for key in keys:
        parsed = date_value(metadata.get(key))
        if parsed is not None:
            return parsed
    return None
