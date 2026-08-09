from __future__ import annotations

import sys
from dataclasses import replace
from pathlib import Path
from uuid import UUID

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from ingestion_application_fakes import FakeCanonical, FakeOutbox, FakeReceipts, part

from app.modules.ingestion.receipt_repository import ack_event_id
from app.modules.ingestion.service import (
    ACK_EVENT_TYPE,
    IngestionApplicationService,
    IngestionCorruptionError,
    IngestionIdentityCollision,
)


@pytest.mark.anyio
async def test_first_apply_then_replay_is_exactly_once() -> None:
    ingestion_part = part()
    receipts = FakeReceipts()
    canonical = FakeCanonical()
    outbox = FakeOutbox(receipts)
    service = IngestionApplicationService(receipts, canonical, outbox)

    receipt = await service.apply(ingestion_part)
    assert receipt.applied_at is not None
    assert canonical.calls == 1
    assert ingestion_part.source_message_id in receipts.processed
    assert outbox.calls == 1

    await service.apply(ingestion_part)
    assert canonical.calls == 1
    assert outbox.calls == 1


@pytest.mark.anyio
async def test_replay_repairs_marker_and_ack_without_reapplying() -> None:
    ingestion_part = part()
    receipts = FakeReceipts()
    canonical = FakeCanonical()
    outbox = FakeOutbox(receipts)
    service = IngestionApplicationService(receipts, canonical, outbox)
    await service.apply(ingestion_part)

    receipts.processed.clear()
    receipts.acks.clear()
    await service.apply(ingestion_part)

    assert canonical.calls == 1
    assert ingestion_part.source_message_id in receipts.processed
    assert outbox.calls == 2
    ack = receipts.acks[ack_event_id(ingestion_part.source_message_id)]
    assert ack.event_type == ACK_EVENT_TYPE


@pytest.mark.anyio
async def test_same_identity_with_different_digest_collides_before_mutation() -> None:
    ingestion_part = part()
    receipts = FakeReceipts()
    canonical = FakeCanonical()
    service = IngestionApplicationService(receipts, canonical, FakeOutbox(receipts))
    await service.apply(ingestion_part)
    corrupted = replace(ingestion_part, wire_digest="f" * 64)

    with pytest.raises(IngestionIdentityCollision):
        await service.apply(corrupted)
    assert canonical.calls == 1


@pytest.mark.anyio
async def test_processed_marker_without_receipt_is_corruption() -> None:
    ingestion_part = part()
    receipts = FakeReceipts()
    receipts.processed.add(ingestion_part.source_message_id)
    canonical = FakeCanonical()
    service = IngestionApplicationService(receipts, canonical, FakeOutbox(receipts))

    with pytest.raises(IngestionCorruptionError, match="without ingestion receipt"):
        await service.apply(ingestion_part)
    assert canonical.calls == 0


def test_ack_identity_is_stable() -> None:
    source = UUID("cfeab125-1d7b-44ad-8bd2-d7791324e68b")
    assert ack_event_id(source) == ack_event_id(source)
