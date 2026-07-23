from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SanitizationResult:
    value: Any
    replacements: int


def _sanitize_string(value: str) -> tuple[str, int]:
    if "\x00" not in value:
        return value, 0
    sanitized = value.replace("\x00", "")
    return sanitized, value.count("\x00")


def sanitize_source_payload(value: Any) -> SanitizationResult:
    if isinstance(value, str):
        sanitized, replacements = _sanitize_string(value)
        return SanitizationResult(value=sanitized, replacements=replacements)

    if isinstance(value, dict):
        sanitized: dict[Any, Any] = {}
        total_replacements = 0
        for key, item in value.items():
            sanitized_key = key
            if isinstance(key, str):
                sanitized_key, key_replacements = _sanitize_string(key)
                total_replacements += key_replacements
            item_result = sanitize_source_payload(item)
            sanitized[sanitized_key] = item_result.value
            total_replacements += item_result.replacements
        return SanitizationResult(value=sanitized, replacements=total_replacements)

    if isinstance(value, list):
        sanitized_list: list[Any] = []
        total_replacements = 0
        for item in value:
            item_result = sanitize_source_payload(item)
            sanitized_list.append(item_result.value)
            total_replacements += item_result.replacements
        return SanitizationResult(value=sanitized_list, replacements=total_replacements)

    if isinstance(value, tuple):
        sanitized_tuple: list[Any] = []
        total_replacements = 0
        for item in value:
            item_result = sanitize_source_payload(item)
            sanitized_tuple.append(item_result.value)
            total_replacements += item_result.replacements
        return SanitizationResult(value=tuple(sanitized_tuple), replacements=total_replacements)

    return SanitizationResult(value=value, replacements=0)


def sanitize_postgres_text(value: str | None) -> str | None:
    if value is None:
        return None
    if "\x00" not in value:
        return value
    result = value.replace("\x00", "")
    logger.warning("sanitize_postgres_text: replaced NUL in field (length=%d)", len(result))
    return result


def validate_external_identifier(value: Any, field_name: str) -> str:
    reason: str | None = None
    if value is None:
        reason = "value is None"
    elif not isinstance(value, str):
        value = str(value)

    if reason is None:
        stripped = value.strip()
        if stripped == "":
            reason = "value is empty or whitespace-only"
        elif "\x00" in stripped:
            reason = "value contains NUL character"
        elif len(stripped) > 255:
            reason = "value exceeds 255 characters"
        else:
            return stripped

    logger.warning(
        "validate_external_identifier: rejected invalid %s=%r error=%s",
        field_name,
        value,
        reason,
    )
    raise ValueError(f"Invalid external identifier for {field_name}: {reason}")
