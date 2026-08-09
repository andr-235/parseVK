from __future__ import annotations

import sys
from dataclasses import replace
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from uuid import UUID

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path
from test_ingestion_contract import _raw_post_part

use_service_path()

from app.modules.ingestion.contract import parse_ingestion_part
from app.modules.ingestion.receipt_repository import ack_event_id, receipt_id
from app.modules.ingestion.service import (
    ACK_EVENT_TYPE,
    IngestionApplicationService,
    IngestionCorruptionError,
    IngestionIdentityCollision,
)


class FakeCanonical:
    def __init__(self):
        self.calls = 0

    async def apply(self, part):
        self.calls += 1
        return {
            "postsInserted": 1,
            "postsUpdated": 0,
            "authorsInserted": 1,
            "authorsUpdated": 0,
            "commentsInserted": 0,
            "commentsUpdated": 0,
        }


class FakeReceipts:
    def __init__(self):
        self.receipt = None
        self.processed = set()
        self.acks = {}

    async def load(self, part):
        return self.receipt

    async def create(self, part):
        self.receipt = SimpleNamespace(
            id=receipt_id(part.source_service, part.source_message_id),
            source_service=part.source_service,
            source_message_id=part.source_message_id,
            batch_id=part.batch_id,
            part_kind=part.part_kind,
            part_index=part.part_index,
            part_count=part.part_count,
            staging_schema=part.versions.staging_schema,
            packing_version=part.versions.packing,
            event_contract=part.versions.event_contract,
            source_position=part.source,
            page_digest=part.page_digest,
            part_digest=part.part_digest,
            wire_digest=part.wire_digest,
            wire_bytes=part.wire_bytes,
            effect_summary={},
            ack_event_id=ack_event_id(part.source_message_id),
            applied_at=None,
            created_at=datetime.now(UTC),
        )
        return self.receipt

    async def has_processed(self, event_id):
        return event_id in self.processed

    async def ensure_processed(self, event_id, event_type):
        self.processed.add(event_id)

    async def get_ack(self, event_id):
        return self.acks.get(event_id)

    async def flush(self):
        return None


class FakeOutbox:
    def __init__(self, receipts):
        self.receipts = receipts
        self.calls = 0

    async def add_event(self, **kwargs):
        self.calls += 1
        self.receipts.acks[kwargs["event_id"]] = SimpleNamespace(
            event_type=kwargs["event_type"],
            payload=kwargs["payload"],
        )


def _part():
    raw, headers = _raw_post_part()
    return parse_ingestion_part(raw, headers)


@pytest.mark.anyio
async def test_first_apply_then_replay_is_exactly_once() -> None:
    part = _part()
    receipts = FakeReceipts()
    canonical = FakeCanonical()
    outbox = FakeOutbox(receipts)
    service = IngestionApplicationService(receipts, canonical, outbox)

    receipt = await service.apply(part)
    assert receipt.applied_at is not None
    assert canonical.calls == 1
    assert part.source_message_id in receipts.processed
    assert outbox.calls == 1

    await service.apply(part)
    assert canonical.calls == 1
    assert outbox.calls == 1


@pytest.mark.anyio
async def test_replay_repairs_marker_and_ack_without_reapplying() -> None:
    part = _part()
    receipts = FakeReceipts()
    canonical = FakeCanonical()
    outbox = FakeOutbox(receipts)
    service = IngestionApplicationService(receipts, canonical, outbox)
    await service.apply(part)

    receipts.processed.clear()
    receipts.acks.clear()
    await service.apply(part)

    assert canonical.calls == 1
    assert part.source_message_id in receipts.processed
    assert outbox.calls == 2
    ack = receipts.acks[ack_event_id(part.source_message_id)]
    assert ack.event_type == ACK_EVENT_TYPE


@pytest.mark.anyio
async def test_same_identity_with_different_digest_collides_before_mutation() -> None:
    part = _part()
    receipts = FakeReceipts()
    canonical = FakeCanonical()
    service = IngestionApplicationService(receipts, canonical, FakeOutbox(receipts))
    await service.apply(part)
    corrupted = replace(part, wire_digest="f" * 64)

    with pytest.raises(IngestionIdentityCollision):
        await service.apply(corrupted)
    assert canonical.calls == 1


@pytest.mark.anyio
async def test_processed_marker_without_receipt_is_corruption() -> None:
    part = _part()
    receipts = FakeReceipts()
    receipts.processed.add(part.source_message_id)
    canonical = FakeCanonical()
    service = IngestionApplicationService(receipts, canonical, FakeOutbox(receipts))

    with pytest.raises(IngestionCorruptionError, match="without ingestion receipt"):
        await service.apply(part)
    assert canonical.calls == 0


def test_ack_identity_is_stable() -> None:
    source = UUID("cfeab125-1d7b-44ad-8bd2-d7791324e68b")
    assert ack_event_id(source) == ack_event_id(source)
