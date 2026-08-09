from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace

from test_ingestion_contract import _raw_post_part

from app.modules.ingestion.contract import parse_ingestion_part
from app.modules.ingestion.receipt_repository import ack_event_id, receipt_id


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
        self.outbox = {}
        self.acks = self.outbox

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

    async def get_outbox(self, event_id):
        return self.outbox.get(event_id)

    async def get_outbox_by_dedupe_key(self, dedupe_key):
        return next(
            (
                event
                for event in self.outbox.values()
                if event.dedupe_key == dedupe_key
            ),
            None,
        )

    async def has_outbox_dedupe_prefix(self, prefix):
        return any(
            event.dedupe_key is not None and event.dedupe_key.startswith(prefix)
            for event in self.outbox.values()
        )

    async def get_ack(self, event_id):
        return await self.get_outbox(event_id)

    async def flush(self):
        return None


class FakeOutbox:
    def __init__(self, receipts):
        self.receipts = receipts
        self.calls = 0

    async def add_event(self, **kwargs):
        self.calls += 1
        created_at = kwargs.get("created_at") or datetime.now(UTC)
        self.receipts.outbox[kwargs["event_id"]] = SimpleNamespace(
            id=kwargs["event_id"],
            event_type=kwargs["event_type"],
            event_version=kwargs.get("event_version", 1),
            aggregate_type=kwargs["aggregate_type"],
            aggregate_id=kwargs["aggregate_id"],
            correlation_id=kwargs.get("correlation_id"),
            dedupe_key=kwargs.get("dedupe_key"),
            payload=kwargs["payload"],
            created_at=created_at,
        )


def part():
    raw, headers = _raw_post_part()
    return parse_ingestion_part(raw, headers)
