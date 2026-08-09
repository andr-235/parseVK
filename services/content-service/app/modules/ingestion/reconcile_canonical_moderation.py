from __future__ import annotations

import asyncio
import json
from datetime import datetime
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
            for receipt in receipts:
                stats["receiptsScanned"] += 1
                manifest = (receipt.effect_summary or {}).get(MANIFEST_KEY)
                if not isinstance(manifest, dict):
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
                    existing = await session.get(ContentOutboxEvent, event_id)
                    if existing is not None:
                        expected = (
                            CANONICAL_COMMENTS_EVENT_TYPE,
                            version,
                            item["aggregateType"],
                            item["aggregateId"],
                            item.get("correlationId"),
                            item["dedupeKey"],
                            item["payload"],
                            datetime.fromisoformat(item["createdAt"]),
                        )
                        actual = (
                            existing.event_type,
                            existing.event_version,
                            existing.aggregate_type,
                            existing.aggregate_id,
                            existing.correlation_id,
                            existing.dedupe_key,
                            existing.payload,
                            existing.created_at,
                        )
                        if actual != expected:
                            raise RuntimeError(
                                f"canonical moderation outbox {event_id} differs from receipt manifest"
                            )
                        stats["eventsPresent"] += 1
                        continue
                    await outbox.add_event(
                        event_id=event_id,
                        event_type=CANONICAL_COMMENTS_EVENT_TYPE,
                        event_version=version,
                        aggregate_type=item["aggregateType"],
                        aggregate_id=item["aggregateId"],
                        correlation_id=item.get("correlationId"),
                        dedupe_key=item["dedupeKey"],
                        payload=item["payload"],
                        created_at=datetime.fromisoformat(item["createdAt"]),
                    )
                    stats["eventsRepaired"] += 1
    return stats


async def _main() -> None:
    print(json.dumps(await reconcile_canonical_moderation_outbox(), sort_keys=True))


if __name__ == "__main__":
    asyncio.run(_main())
