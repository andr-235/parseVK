from __future__ import annotations


def message_identity(
    payload: dict | None,
) -> tuple[str | None, str]:
    """Read identity from legacy WireEvent or canonical contract envelope."""
    if not payload:
        return None, ""
    message_id = payload.get("event_id") or payload.get("messageId")
    message_type = (
        payload.get("event_type")
        or payload.get("messageType")
        or ""
    )
    return (
        str(message_id) if message_id else None,
        str(message_type),
    )
