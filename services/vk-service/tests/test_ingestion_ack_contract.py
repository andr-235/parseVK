import json
from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.services.ingestion.ack_contract import decode_ingestion_ack

EVENT_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
MESSAGE_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
BATCH_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
RECEIPT_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
DIGESTS = {"page": "1" * 64, "part": "2" * 64, "wire": "3" * 64}


def _payload() -> dict:
    return {
        "sourceService": "vk-service",
        "sourceMessageId": str(MESSAGE_ID),
        "batchId": str(BATCH_ID),
        "partKind": "comments",
        "partIndex": 0,
        "partCount": 1,
        "versions": {"stagingSchema": 1, "packing": 1, "eventContract": 1},
        "sourcePosition": {
            "kind": "comment_page",
            "ownerId": -42,
            "postId": 99,
            "pageOffset": 0,
            "nextOffset": 2,
        },
        "pageDigest": DIGESTS["page"],
        "partDigest": DIGESTS["part"],
        "wireDigest": DIGESTS["wire"],
        "receiptId": str(RECEIPT_ID),
        "appliedAt": datetime(2026, 8, 9, tzinfo=UTC).isoformat(),
        "effectSummary": {"comments": 2},
    }


def _wire() -> bytes:
    return json.dumps(
        {
            "event_id": str(EVENT_ID),
            "event_type": "content.ingestion.part-applied",
            "event_version": 1,
            "aggregate_type": "vk_ingestion_part",
            "aggregate_id": str(MESSAGE_ID),
            "payload": _payload(),
            "created_at": datetime(2026, 8, 9, tzinfo=UTC).isoformat(),
        }
    ).encode()


def _headers() -> list[tuple[str, bytes]]:
    values = {
        "event-id": str(EVENT_ID),
        "event-type": "content.ingestion.part-applied",
        "source-service": "vk-service",
        "source-message-id": str(MESSAGE_ID),
        "batch-id": str(BATCH_ID),
        "part-kind": "comments",
        "part-index": "0",
        "part-count": "1",
        "page-digest": DIGESTS["page"],
        "part-digest": DIGESTS["part"],
        "wire-digest": DIGESTS["wire"],
    }
    return [(name, value.encode()) for name, value in values.items()]


def test_ack_requires_payload_and_headers_to_match() -> None:
    ack = decode_ingestion_ack(_wire(), _headers())
    assert ack.source_message_id == MESSAGE_ID
    assert ack.receipt_id == RECEIPT_ID
    assert ack.source_position["nextOffset"] == 2


def test_ack_rejects_header_payload_split_brain() -> None:
    headers = _headers()
    headers[-1] = ("wire-digest", ("f" * 64).encode())
    with pytest.raises(ValueError, match="headers do not match"):
        decode_ingestion_ack(_wire(), headers)


def test_ack_rejects_duplicate_required_header() -> None:
    headers = _headers() + [("event-id", str(EVENT_ID).encode())]
    with pytest.raises(ValueError, match="duplicate"):
        decode_ingestion_ack(_wire(), headers)
