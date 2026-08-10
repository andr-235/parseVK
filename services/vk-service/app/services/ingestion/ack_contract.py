from __future__ import annotations

from collections.abc import Iterable

from common.events import WireEvent

from app.domain.entities.ingestion_ack import IngestionPartAppliedAck

_REQUIRED_HEADERS = (
    "event-id",
    "event-type",
    "source-service",
    "source-message-id",
    "batch-id",
    "part-kind",
    "part-index",
    "part-count",
    "page-digest",
    "part-digest",
    "wire-digest",
)


def decode_ingestion_ack(
    raw_value: bytes,
    headers: Iterable[tuple[str, bytes | None]],
) -> IngestionPartAppliedAck:
    event = WireEvent.model_validate_json(raw_value)
    ack = IngestionPartAppliedAck.from_event(event)
    actual = _required_headers(headers)
    expected = {
        "event-id": str(ack.ack_event_id),
        "event-type": event.event_type,
        "source-service": "vk-service",
        "source-message-id": str(ack.source_message_id),
        "batch-id": str(ack.batch_id),
        "part-kind": ack.part_kind,
        "part-index": str(ack.part_index),
        "part-count": str(ack.part_count),
        "page-digest": ack.page_digest,
        "part-digest": ack.part_digest,
        "wire-digest": ack.wire_digest,
    }
    if actual != expected:
        raise ValueError("ingestion ACK Kafka headers do not match payload")
    return ack


def _required_headers(
    headers: Iterable[tuple[str, bytes | None]],
) -> dict[str, str]:
    result: dict[str, str] = {}
    required = frozenset(_REQUIRED_HEADERS)
    for name, raw_value in headers:
        if name not in required:
            continue
        if name in result:
            raise ValueError(f"duplicate ingestion ACK header: {name}")
        if raw_value is None:
            raise ValueError(f"empty ingestion ACK header: {name}")
        try:
            result[name] = raw_value.decode("utf-8")
        except UnicodeDecodeError as error:
            raise ValueError(f"non-UTF8 ingestion ACK header: {name}") from error
    missing = required.difference(result)
    if missing:
        raise ValueError(f"missing ingestion ACK headers: {sorted(missing)}")
    return result
