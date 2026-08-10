from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime
from uuid import UUID

import httpx
from common.events import WireEvent

from app.domain.entities.ingestion_ack import IngestionPartAppliedAck

RECONCILIATION_PATH = "/internal/ingestion/receipts/reconciliation"


class IngestionAckReconciliationError(RuntimeError):
    pass


class ContentIngestionReceiptClient:
    def __init__(
        self,
        *,
        base_url: str,
        internal_token: str,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._internal_token = internal_token
        self._client = http_client

    async def fetch_applied(
        self,
        source_message_ids: Sequence[UUID],
    ) -> tuple[IngestionPartAppliedAck, ...]:
        if not source_message_ids:
            return ()
        requested = frozenset(source_message_ids)
        response = await self._post(
            {"sourceMessageIds": [str(value) for value in source_message_ids]}
        )
        body = response.json()
        if not isinstance(body, dict) or not isinstance(body.get("items"), list):
            raise IngestionAckReconciliationError(
                "invalid content receipt reconciliation response"
            )
        seen: set[UUID] = set()
        result: list[IngestionPartAppliedAck] = []
        for row in body["items"]:
            ack = _ack_from_row(row)
            if ack.source_message_id not in requested:
                raise IngestionAckReconciliationError(
                    "content returned an unrequested ingestion receipt"
                )
            if ack.source_message_id in seen:
                raise IngestionAckReconciliationError(
                    "content returned duplicate ingestion receipt evidence"
                )
            seen.add(ack.source_message_id)
            result.append(ack)
        return tuple(result)

    async def _post(self, payload: dict) -> httpx.Response:
        headers = {"X-Internal-Service-Token": self._internal_token}
        url = f"{self._base_url}{RECONCILIATION_PATH}"
        if self._client is not None:
            response = await self._client.post(url, headers=headers, json=payload)
        else:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response


def _ack_from_row(row: object) -> IngestionPartAppliedAck:
    if not isinstance(row, dict) or not isinstance(row.get("payload"), dict):
        raise IngestionAckReconciliationError("invalid receipt reconciliation row")
    try:
        event_id = UUID(str(row["ackEventId"]))
        payload = dict(row["payload"])
        source_message_id = UUID(str(payload["sourceMessageId"]))
    except (KeyError, TypeError, ValueError) as error:
        raise IngestionAckReconciliationError(
            "invalid receipt reconciliation identity"
        ) from error
    event = WireEvent(
        event_id=event_id,
        event_type="content.ingestion.part-applied",
        event_version=1,
        aggregate_type="vk_ingestion_part",
        aggregate_id=str(source_message_id),
        payload=payload,
        created_at=datetime.now(UTC).isoformat(),
    )
    try:
        return IngestionPartAppliedAck.from_event(event)
    except ValueError as error:
        raise IngestionAckReconciliationError(
            "invalid receipt reconciliation ACK evidence"
        ) from error
