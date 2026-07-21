from datetime import UTC, datetime
from typing import Any


def _coerce_timestamp(value: Any) -> int | None:
    if value is None:
        return None
    try:
        ts = int(value)
    except (TypeError, ValueError):
        return None
    if ts > 1_000_000_000_000:
        ts //= 1000
    return ts


def _extract_text(payload: dict) -> str | None:
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
                return value.strip()
    return None


async def process_chat_messages(
    messenger: str,
    chat_id: str,
    raw_messages: list[dict],
    *,
    include_system: bool,
    upsert_message_fn,
    emit_message_collected_fn=None,
) -> int:
    if not include_system:
        raw_messages = [m for m in raw_messages if m.get("type") != "system"]

    count = 0
    for msg in raw_messages:
        ts = _coerce_timestamp(msg.get("time") or msg.get("timestamp"))
        msg_text = _extract_text(msg)
        sender = (
            msg.get("senderName") or msg.get("from_name")
            or msg.get("from") or msg.get("author")
        )
        await upsert_message_fn({
            "external_id": str(msg.get("id") or ""),
            "chat_id": chat_id,
            "chat_name": None,
            "author": sender,
            "text": msg_text,
            "content_url": None,
            "content_type": None,
            "created_at": datetime.fromtimestamp(ts, tz=UTC) if ts else None,
            "raw": msg,
        })
        if emit_message_collected_fn:
            await emit_message_collected_fn(str(msg.get("id", "")), msg)
        count += 1
    return count
