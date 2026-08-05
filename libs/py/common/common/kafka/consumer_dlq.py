"""Dead-letter metadata helpers for Kafka consumers."""

from datetime import UTC, datetime

MAX_FAILURE_REASON_BYTES = 2000


def build_dlq_headers(
    *,
    consumer_name: str,
    original_topic: str,
    event_id: str | None = None,
    event_type: str = "",
    retry_count: int = 0,
    failure_reason: str = "",
) -> list[tuple[str, bytes]]:
    headers: list[tuple[str, bytes]] = [
        ("consumer_name", consumer_name.encode()),
        ("original_topic", original_topic.encode()),
        ("failed_at", datetime.now(UTC).isoformat().encode()),
    ]
    if event_id:
        headers.append(("event_id", event_id.encode()))
    if event_type:
        headers.append(("event_type", event_type.encode()))
    if retry_count:
        headers.append(("retry_count", str(retry_count).encode()))
    if failure_reason:
        headers.append(("failure_reason", _utf8_prefix(failure_reason)))
    return headers


def _utf8_prefix(value: str) -> bytes:
    encoded = value.encode("utf-8")
    if len(encoded) <= MAX_FAILURE_REASON_BYTES:
        return encoded
    return (
        encoded[:MAX_FAILURE_REASON_BYTES]
        .decode("utf-8", errors="ignore")
        .encode("utf-8")
    )
