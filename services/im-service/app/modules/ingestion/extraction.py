from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

logger = logging.getLogger(__name__)

# Импорт из sanitization — опционально, для ad-hoc использования.
# Основной caller отвечает за санитизацию payload до передачи сюда.


def _extract_text(payload: dict) -> str | None:
    """Extract text from a Wappi message payload.
    
    The payload is expected to be already sanitized by the caller.
    """
    for path in (
        ("body",), ("caption",), ("text", "body"),
        ("image", "caption"), ("video", "caption"),
        ("document", "caption"), ("gif", "caption"),
        ("link_preview", "body"),
        ("interactive", "body", "text"),
        ("interactive", "header", "text"),
        ("buttons", "text"), ("list", "body"),
        ("system", "body"), ("hsm", "body"),
        ("poll", "title"), ("order", "title"), ("order", "text"),
        ("group_invite", "body"), ("newsletter_invite", "body"),
        ("admin_invite", "body"), ("catalog", "title"),
        ("catalog", "description"), ("location", "address"),
        ("location", "name"), ("action", "comment"),
    ):
        value = payload
        for key in path:
            if not isinstance(value, dict):
                break
            value = value.get(key)
        else:
            if isinstance(value, str) and value.strip():
                text = value.strip()
                logger.debug("extraction: extracted text length=%d", len(text))
                return text
    return None


def _coerce_timestamp(value: Any) -> datetime | None:
    """Parse various timestamp formats into a timezone-aware datetime.
    
    Returns None if the value cannot be parsed.
    """
    if value is None:
        return None
    try:
        ts = int(value)
    except (TypeError, ValueError):
        logger.warning("extraction: failed to parse timestamp value=%r", value)
        return None
    if ts > 1_000_000_000_000:
        ts //= 1000
    return datetime.fromtimestamp(ts, tz=UTC)


def _extract_author_id(payload: dict) -> str | None:
    """Extract author identifier from the message payload."""
    return payload.get("author") or None


def _extract_author_name(payload: dict) -> str | None:
    """Extract author display name from the message payload."""
    return (
        payload.get("senderName")
        or payload.get("from_name")
        or payload.get("from")
        or payload.get("author")
    )
