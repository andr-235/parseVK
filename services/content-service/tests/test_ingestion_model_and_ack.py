from __future__ import annotations

import sys
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from common.outbox.models import OutboxMessage

from app.modules.ingestion.ack_transport import ingestion_ack_headers
from app.modules.ingestion.models import ContentIngestionReceipt
from app.modules.ingestion.service import ACK_EVENT_TYPE


def test_receipt_model_has_required_uniqueness_and_checks() -> None:
    table = ContentIngestionReceipt.__table__
    assert table.name == "content_ingestion_receipts"
    names = {constraint.name for constraint in table.constraints if constraint.name}
    assert "uq_content_ingestion_receipt_source_message" in names
    assert "uq_content_ingestion_receipt_batch_part" in names
    assert "ck_content_ingestion_receipt_part_index" in names


def test_ack_headers_preserve_ingestion_identity() -> None:
    event_id = UUID("22222222-2222-4222-8222-222222222222")
    source_id = UUID("33333333-3333-4333-8333-333333333333")
    message = OutboxMessage(
        id=event_id,
        event_type=ACK_EVENT_TYPE,
        event_version=1,
        aggregate_type="vk_ingestion_part",
        aggregate_id=str(source_id),
        correlation_id=None,
        payload={
            "sourceService": "vk-service",
            "sourceMessageId": str(source_id),
            "batchId": "11111111-1111-4111-8111-111111111111",
            "partKind": "post",
            "partIndex": 0,
            "partCount": 1,
            "pageDigest": "a" * 64,
            "partDigest": "b" * 64,
            "wireDigest": "c" * 64,
        },
        attempts=0,
        created_at=datetime.now(UTC),
    )
    headers = dict(ingestion_ack_headers(message))

    assert headers["event-id"] == str(event_id).encode()
    assert headers["source-message-id"] == str(source_id).encode()
    assert headers["wire-digest"] == ("c" * 64).encode()


def test_legacy_post_comment_projection_handlers_are_removed() -> None:
    source = (
        Path(__file__).resolve().parents[1]
        / "app"
        / "modules"
        / "projections"
        / "service.py"
    ).read_text(encoding="utf-8")

    assert "vk.post_collected" not in source
    assert "vk.comments_collected" not in source
    assert "_handle_batch_comments" not in source
