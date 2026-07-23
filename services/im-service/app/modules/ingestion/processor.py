from __future__ import annotations

import logging

from app.modules.ingestion.mapper import (
    NormalizedImMessage,
    map_raw_to_normalized,
)

logger = logging.getLogger(__name__)


async def process_chat_messages(
    messenger: str,
    chat_id: str,
    raw_messages: list[dict],
    *,
    include_system: bool,
    upsert_message_fn,
    emit_message_collected_fn=None,
) -> int:
    """Process a batch of raw messages.

    For each message:
    1. Maps raw → NormalizedImMessage via map_raw_to_normalized().
    2. If result is None (system message or invalid), skips it.
    3. Calls upsert_message_fn(normalized) with the normalized object.
    4. If emit_message_collected_fn is provided, calls it with the normalized object.

    Returns the count of successfully processed messages.
    """
    logger.debug(
        "process_chat_messages: start messenger=%s chat_id=%s count=%d",
        messenger,
        chat_id,
        len(raw_messages),
    )

    count = 0
    for msg in raw_messages:
        normalized = map_raw_to_normalized(
            messenger=messenger,
            chat_id=chat_id,
            raw_message=msg,
            include_system=include_system,
        )
        if normalized is None:
            continue

        await upsert_message_fn(normalized)
        logger.debug(
            "process_chat_messages: normalized message_id=%s",
            normalized.external_id,
        )

        if emit_message_collected_fn:
            await emit_message_collected_fn(normalized)
        count += 1

    logger.info(
        "process_chat_messages: done messenger=%s chat_id=%s processed=%d",
        messenger,
        chat_id,
        count,
    )
    return count
