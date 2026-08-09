from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import UUID

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.security import require_internal_token
from app.modules.ingestion.dependencies import get_ingestion_receipt_repository
from app.modules.ingestion.router import router

MESSAGE_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
ACK_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
RECEIPT_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")


class FakeRepository:
    def __init__(self):
        self.calls = []

    async def load_applied_by_source_ids(self, source_ids):
        self.calls.append(source_ids)
        return (
            SimpleNamespace(
                id=RECEIPT_ID,
                ack_event_id=ACK_ID,
                source_service="vk-service",
                source_message_id=MESSAGE_ID,
                batch_id=UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                part_kind="comments",
                part_index=0,
                part_count=1,
                staging_schema=1,
                packing_version=1,
                event_contract=1,
                source_position={"kind": "comment_page", "ownerId": -42, "postId": 99, "pageOffset": 0},
                page_digest="1" * 64,
                part_digest="2" * 64,
                wire_digest="3" * 64,
                applied_at=datetime(2026, 8, 9, tzinfo=UTC),
                effect_summary={"comments": 1},
            ),
        )


@pytest.mark.anyio
async def test_receipt_reconciliation_returns_durable_ack_evidence() -> None:
    repository = FakeRepository()
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[require_internal_token] = lambda: None
    app.dependency_overrides[get_ingestion_receipt_repository] = lambda: repository

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
