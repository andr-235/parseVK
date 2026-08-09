from __future__ import annotations

import json
import sys
from hashlib import sha256
from pathlib import Path
from uuid import UUID, uuid5

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from common.events import WireEvent

from app.modules.ingestion.contract import (
    PART_NAMESPACE,
    IngressValidationError,
    parse_ingestion_part,
)


def _raw_post_part() -> tuple[bytes, list[tuple[str, bytes]]]:
    batch_id = UUID("11111111-1111-4111-8111-111111111111")
    part_id = uuid5(PART_NAMESPACE, f"{batch_id}:post:1:1:1:0")
    payload = {
        "batchId": str(batch_id),
        "partId": str(part_id),
        "partKind": "post",
        "partIndex": 0,
        "partCount": 1,
        "versions": {"stagingSchema": 1, "packing": 1, "eventContract": 1},
        "source": {
            "kind": "post_snapshot",
            "ownerId": -10,
            "postId": 20,
            "pageOffset": 0,
            "nextOffset": None,
            "providerMetadata": {},
        },
        "post": {"id": 20, "owner_id": -10, "from_id": 30, "text": "post"},
        "comments": [],
        "authors": [
            {
                "vkAuthorId": 30,
                "type": "user",
                "displayName": "Author",
                "providerData": {"first_name": "A"},
            }
        ],
    }
    event = WireEvent(
        event_id=part_id,
        event_type="vk.ingestion.post-part-prepared",
        event_version=1,
        aggregate_type="vk_ingestion_batch",
        aggregate_id=str(batch_id),
        correlation_id="corr-1",
        payload=payload,
        created_at="2026-08-09T00:00:00+00:00",
    )
    raw = event.model_dump_json().encode()
    wire_digest = sha256(raw).hexdigest()
    manifest = {
        "messageId": str(part_id),
        "batchId": str(batch_id),
        "partKind": "post",
        "partIndex": 0,
        "partCount": 1,
        "versions": payload["versions"],
        "items": ["post:-10:20"],
        "authors": [30],
        "preparedAt": event.created_at,
        "wireDigest": wire_digest,
        "wireBytes": len(raw),
    }
    canonical = json.dumps(
        manifest,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode()
    part_digest = sha256(canonical).hexdigest()
    headers = [
        ("event-id", str(part_id).encode()),
        ("event-type", event.event_type.encode()),
        ("source-service", b"vk-service"),
        ("batch-id", str(batch_id).encode()),
        ("wire-digest", wire_digest.encode()),
        ("page-digest", ("a" * 64).encode()),
        ("part-digest", part_digest.encode()),
    ]
    return raw, headers


def test_valid_part_recomputes_identity_and_digests() -> None:
    raw, headers = _raw_post_part()
    part = parse_ingestion_part(raw, headers)
    batch_id = UUID("11111111-1111-4111-8111-111111111111")
    expected_id = uuid5(PART_NAMESPACE, f"{batch_id}:post:1:1:1:0")
    expected_part_digest = dict(headers)["part-digest"].decode()
    assert part.source_message_id == expected_id
    assert part.batch_id == batch_id
    assert part.part_digest == expected_part_digest
    assert part.wire_digest == sha256(raw).hexdigest()


def test_wire_digest_mismatch_fails_before_application() -> None:
    raw, headers = _raw_post_part()
    headers = [
        (name, ("b" * 64).encode() if name == "wire-digest" else value)
        for name, value in headers
    ]
    with pytest.raises(IngressValidationError, match="wire-digest"):
        parse_ingestion_part(raw, headers)


def test_part_digest_mismatch_is_rejected() -> None:
    raw, headers = _raw_post_part()
    headers = [
        (name, ("b" * 64).encode() if name == "part-digest" else value)
        for name, value in headers
    ]
    with pytest.raises(IngressValidationError, match="part digest mismatch"):
        parse_ingestion_part(raw, headers)


def test_missing_part_digest_is_rejected() -> None:
    raw, headers = _raw_post_part()
    headers = [(name, value) for name, value in headers if name != "part-digest"]
    with pytest.raises(IngressValidationError, match="part-digest"):
        parse_ingestion_part(raw, headers)
