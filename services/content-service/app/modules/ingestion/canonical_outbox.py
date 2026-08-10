from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from app.modules.ingestion.ack import IngestionCorruptionError
from app.modules.ingestion.canonical_events import (
    CANONICAL_COMMENTS_EVENT_TYPE,
    MANIFEST_KEY,
)
from app.modules.ingestion.models import ContentIngestionReceipt


def _utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def canonical_manifest(receipt: ContentIngestionReceipt) -> tuple[int, list[dict]]:
    manifest = receipt.effect_summary.get(MANIFEST_KEY)
    if not isinstance(manifest, dict) or manifest.get("contractVersion") != 1:
        raise IngestionCorruptionError("canonical moderation manifest is invalid")
    events = manifest.get("events")
    if not isinstance(events, list):
        raise IngestionCorruptionError("canonical moderation manifest events are invalid")
    return int(manifest["contractVersion"]), events


def verify_canonical_outbox(existing, version: int, item: dict) -> None:
    expected = (
        CANONICAL_COMMENTS_EVENT_TYPE,
        version,
        item["aggregateType"],
        item["aggregateId"],
        item.get("correlationId"),
        item["dedupeKey"],
        item["payload"],
        _utc(datetime.fromisoformat(item["createdAt"])),
    )
    actual = (
        existing.event_type,
        existing.event_version,
        existing.aggregate_type,
        existing.aggregate_id,
        existing.correlation_id,
        existing.dedupe_key,
        existing.payload,
        _utc(existing.created_at),
    )
    if actual != expected:
        raise IngestionCorruptionError(
            "canonical moderation outbox differs from manifest"
        )


class CanonicalModerationOutboxManager:
    def __init__(self, receipts, outbox) -> None:
        self._receipts = receipts
        self._outbox = outbox

    async def ensure(self, receipt: ContentIngestionReceipt) -> None:
        version, events = canonical_manifest(receipt)
        for item in events:
            event_id = UUID(item["eventId"])
            dedupe_key = item["dedupeKey"]
            existing = await self._receipts.get_outbox(event_id)
            by_dedupe = await self._receipts.get_outbox_by_dedupe_key(dedupe_key)
            if by_dedupe is not None and by_dedupe.id != event_id:
                raise IngestionCorruptionError(
                    "canonical moderation dedupe key belongs to a different event"
                )
            if existing is not None:
                verify_canonical_outbox(existing, version, item)
                continue
            await self._outbox.add_event(
                event_id=event_id,
                event_type=CANONICAL_COMMENTS_EVENT_TYPE,
                event_version=version,
                aggregate_type=item["aggregateType"],
                aggregate_id=item["aggregateId"],
                correlation_id=item.get("correlationId"),
                dedupe_key=dedupe_key,
                payload=item["payload"],
                created_at=datetime.fromisoformat(item["createdAt"]),
            )
