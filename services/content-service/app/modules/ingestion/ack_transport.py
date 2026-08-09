from __future__ import annotations

from common.outbox.models import OutboxMessage

from app.modules.ingestion.service import ACK_EVENT_TYPE


def ingestion_ack_headers(message: OutboxMessage) -> list[tuple[str, bytes]]:
    if message.event_type != ACK_EVENT_TYPE:
        return []
    payload = message.payload
    values = {
        "event-id": str(message.id),
        "event-type": message.event_type,
        "source-service": str(payload["sourceService"]),
        "source-message-id": str(payload["sourceMessageId"]),
        "batch-id": str(payload["batchId"]),
        "part-kind": str(payload["partKind"]),
        "part-index": str(payload["partIndex"]),
        "part-count": str(payload["partCount"]),
        "page-digest": str(payload["pageDigest"]),
        "part-digest": str(payload["partDigest"]),
        "wire-digest": str(payload["wireDigest"]),
    }
    return [(key, value.encode("utf-8")) for key, value in values.items()]
