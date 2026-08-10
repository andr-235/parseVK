from datetime import UTC, datetime
from uuid import UUID

import httpx
import pytest

from app.services.ingestion.reconciliation_client import ContentIngestionReceiptClient

MESSAGE_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


def _row() -> dict:
    return {
        "ackEventId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "payload": {
            "sourceService": "vk-service",
            "sourceMessageId": str(MESSAGE_ID),
            "batchId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
            "partKind": "comments",
            "partIndex": 0,
            "partCount": 1,
            "versions": {"stagingSchema": 1, "packing": 1, "eventContract": 1},
            "sourcePosition": {"kind": "comment_page", "ownerId": -42, "postId": 99, "pageOffset": 0},
            "pageDigest": "1" * 64,
            "partDigest": "2" * 64,
            "wireDigest": "3" * 64,
            "receiptId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
            "appliedAt": datetime(2026, 8, 9, tzinfo=UTC).isoformat(),
            "effectSummary": {"comments": 1},
        },
    }


@pytest.mark.anyio
async def test_reconciliation_client_validates_requested_receipt_identity() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["X-Internal-Service-Token"] == "secret"
        return httpx.Response(200, json={"items": [_row()]})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
        client = ContentIngestionReceiptClient(
            base_url="http://content",
            internal_token="secret",
            http_client=http_client,
        )
        result = await client.fetch_applied([MESSAGE_ID])

    assert len(result) == 1
    assert result[0].source_message_id == MESSAGE_ID
    assert result[0].page_digest == "1" * 64
