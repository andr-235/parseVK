from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select

from app.db.models import ContentOutboxEvent
from app.db.session import SessionLocal
from app.modules.ingestion.canonical_events import (
    CANONICAL_COMMENTS_EVENT_TYPE,
    MANIFEST_KEY,
)
from app.modules.ingestion.models import ContentIngestionReceipt
from app.modules.projections.outbox_service import ContentOutboxService


def _utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


async def reconcile_canonical_moderation_outbox() -> dict[str, int]:
    stats = {
        "receiptsScanned": 0,
        "eventsPresent": 0,
        "eventsRepaired": 0,
        "receiptsWithoutManifest": 0,
    }
    async with SessionLocal() as session:
        async with session.begin():
            receipts = (
                await session.scalars(
                    select(ContentIngestionReceipt)
                    .where(ContentIngestionReceipt.applied_at.is_not(None))
                    .order_by(ContentIngestionReceipt.created_at, ContentIngestionReceipt.id)
                )
            ).all()
            outbox = ContentOutboxService(session)
            expected_event_ids: set[UUID] = set()
            expected_dedupe_keys: dict[str, UUID] = {}

            for receipt in receipts:
                stats["receiptsScanned"] += 1
                manifest = (receipt.effect_summary or {}).get(MANIFEST_KEY)
                if not isinstance(manifest, dict):
                    # Pre-cutover receipts intentionally have no canonical moderation
                    # manifest. Existing rows are backfilled through the content API,
                    # never reconstructed from historical staged payloads.
                    stats["receiptsWithoutManifest"] += 1
                    continue
                version = manifest.get("contractVersion")
                events = manifest.get("events")
                if version != 1 or not isinstance(events, list):
                    raise RuntimeError(
                        f"invalid canonical moderation manifest in receipt {receipt.id}"
                    )
                for item in events:
                    event_id = UUID(item["eventId"])
                    dedupe_key = item["dedupeKey"]
                    if event_id in expected_event_ids:
                        raise RuntimeError(
                            f"canonical moderation event {event_id} is claimed by multiple manifests"
                        )
                    previous_event_id = expected_dedupe_keys.get(dedupe_key)
                    if previous_event_id is not None and previous_event_id != event_id:
                        raise RuntimeError(
                            f"canonical moderation dedupe key {dedupe_key} is claimed by multiple events"
                        )
                    expected_event_ids.add(event_id)
                    expected_dedupe_keys[dedupe_key] = event_id

                    existing = await session.get(ContentOutboxEvent, event_id)
                    by_dedupe = await session.scalar(
                        select(ContentOutboxEvent).where(
                            ContentOutboxEvent.dedupe_key == dedupe_key
                        )
                    )
                    if by_dedupe is not None and by_dedupe.id != event_id:
                        raise RuntimeError(
                            f"canonical moderation dedupe key {dedupe_key} belongs to "
                            f"unexpected event {by_dedupe.id}"
                        )
                    if existing is not None:
                        _verify_existing(existing, version, item)
                        stats["eventsPresent"] += 1
                        continue
                    await outbox.add_event(
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
                    stats["eventsRepaired"] += 1

            canonical_outbox_ids = (
                await session.scalars(
                    select(ContentOutboxEvent.id).where(
                        ContentOutboxEvent.event_type == CANONICAL_COMMENTS_EVENT_TYPE
                    )
                )
            ).all()
            orphan_ids = sorted(
                (
                    event_id
                    for event_id in canonical_outbox_ids
                    if event_id not in expected_event_ids
                ),
                key=str,
            )
            if orphan_ids:
                raise RuntimeError(
                    "canonical moderation outbox exists without receipt manifest: "
                    + ", ".join(str(event_id) for event_id in orphan_ids[:10])
                )
    return stats


def _verify_existing(existing: ContentOutboxEvent, version: int, item: dict) -> None:
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
        raise RuntimeError(
            f"canonical moderation outbox {existing.id} differs from receipt manifest"
        )


async def _main() -> None:
    print(json.dumps(await reconcile_canonical_moderation_outbox(), sort_keys=True))


if __name__ == "__main__":
    asyncio.run(_main())
