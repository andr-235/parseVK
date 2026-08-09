from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import UUID

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.security import require_internal_token
from app.modules.ingestion.dependencies import (
    get_content_outbox_service,
    get_ingestion_receipt_repository,
)
from app.modules.ingestion.router import router

MESSAGE_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
ACK_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
RECEIPT_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
BATCH_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")


class FakeRepository:
    def __init__(self):
        self.calls = []
        self.ack = None
        self.flushes = 0

    async def load_applied_by_source_ids(self, source_ids):
        self.calls.append(source_ids)
        return (self.receipt(),)

    async def get_ack(self, event_id):
        if self.ack is not None and self.ack.id == event_id:
            return self.ack
        return None

    async def get_outbox_by_dedupe_key(self, dedupe_key):
        if self.ack is not None and self.ack.dedupe_key == dedupe_key:
            return self.ack
        return None

    async def flush(self):
        self.flushes += 1

    @staticmethod
    def receipt():
        return SimpleNamespace(
            id=RECEIPT_ID,
            ack_event_id=ACK_ID,
            source_service="vk-service",
            source_message_id=MESSAGE_ID,
            batch_id=BATCH_ID,
            part_kind="comments",
            part_index=0,
            part_count=1,
            staging_schema=1,
            packing_version=1,
            event_contract=1,
            source_position={
                "kind": "comment_page",
                "ownerId": -42,
                "postId": 99,
                "pageOffset": 0,
            },
            page_digest="1" * 64,
            part_digest="2" * 64,
            wire_digest="3" * 64,
            applied_at=datetime(2026, 8, 9, tzinfo=UTC),
            effect_summary={"comments": 1},
        )


class FakeOutbox:
    def __init__(self, repository: FakeRepository):
        self.repository = repository
        self.calls = []

    async def add_event(self, **values):
        self.calls.append(values)
        self.repository.ack = SimpleNamespace(
            id=values["event_id"],
            event_type=values["event_type"],
            event_version=values["event_version"],
            aggregate_type=values["aggregate_type"],
            aggregate_id=values["aggregate_id"],
            dedupe_key=values["dedupe_key"],
            payload=values["payload"],
        )


@pytest.mark.anyio
async def test_receipt_reconciliation_regenerates_durable_ack_evidence() -> None:
    repository = FakeRepository()
    outbox = FakeOutbox(repository)
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[require_internal_token] = lambda: None
    app.dependency_overrides[get_ingestion_receipt_repository] = lambda: repository
    app.dependency_overrides[get_content_outbox_service] = lambda: outbox

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/internal/ingestion/receipts/reconciliation",
            json={"sourceMessageIds": [str(MESSAGE_ID), str(MESSAGE_ID)]},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["items"][0]["ackEventId"] == str(ACK_ID)
    assert body["items"][0]["payload"]["receiptId"] == str(RECEIPT_ID)
    assert repository.calls == [[MESSAGE_ID]]
    assert repository.flushes == 1
    assert len(outbox.calls) == 1
    assert outbox.calls[0]["event_id"] == ACK_ID
    assert outbox.calls[0]["dedupe_key"] == f"ingestion-ack:{MESSAGE_ID}"
