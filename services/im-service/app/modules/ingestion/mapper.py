from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from app.modules.ingestion.extraction import (
    _coerce_timestamp,
    _extract_author_id,
    _extract_author_name,
    _extract_text,
)
from app.modules.ingestion.sanitization import (
    sanitize_source_payload,
    validate_external_identifier,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class NormalizedImMessage:
    messenger: str
    external_id: str
    chat_id: str
    chat_name: str | None
    author_id: str | None
    author_name: str | None
    text: str | None
    content_url: str | None
    content_type: str | None
    created_at: datetime | None
    raw: dict


def map_raw_to_normalized(
    messenger: str,
    chat_id: str,
    raw_message: dict,
    *,
    chat_name: str | None = None,
    include_system: bool,
) -> NormalizedImMessage | None:
    """Map a raw messenger payload into a normalized message model.

    Returns ``None`` when the message is a system message and system messages
    are excluded, or when any required identifier fails validation.
    """
    sanitized = sanitize_source_payload(raw_message)
    raw_value = sanitized.value

    try:
        messenger = validate_external_identifier(messenger, "messenger")
        external_id = raw_value.get("id") or raw_value.get("id", "")
        external_id = validate_external_identifier(external_id, "external_id")
        chat_id = validate_external_identifier(chat_id, "chat_id")
    except ValueError as exc:
        logger.error(
            "map_raw_to_normalized: invalid identifier chat_id=%s error=%s",
            chat_id,
            exc,
        )
        return None

    if not include_system and raw_value.get("type") == "system":
        logger.warning(
            "map_raw_to_normalized: skipped system message chat_id=%s",
            chat_id,
        )
        return None

    text = _extract_text(raw_value)
    author_id = _extract_author_id(raw_value)
    author_name = _extract_author_name(raw_value)
    created_at = _coerce_timestamp(raw_value.get("time") or raw_value.get("timestamp"))

    message = NormalizedImMessage(
        messenger=messenger,
        external_id=external_id,
        chat_id=chat_id,
        chat_name=chat_name,
        author_id=author_id,
        author_name=author_name,
        text=text,
        content_url=None,
        content_type=None,
        created_at=created_at,
        raw=raw_value,
    )
    logger.debug(
        "map_raw_to_normalized: messenger=%s chat_id=%s message_id=%s",
        messenger,
        chat_id,
        external_id,
    )
    return message
