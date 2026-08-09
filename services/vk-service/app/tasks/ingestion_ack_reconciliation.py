from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from prometheus_client import Counter
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.infrastructure.db.repositories.ingestion_ack import SqlAlchemyIngestionAckRepository
from app.infrastructure.db.repositories.ingestion_ack_reconciliation import pending_ack_message_ids
from app.infrastructure.db.repositories.ingestion_lifecycle_repair import repair_local_lifecycle
from app.services.ingestion.lifecycle_metrics import observe_lifecycle_snapshot
from app.services.ingestion.reconciliation_client import ContentIngestionReceiptClient

RECONCILIATION_OUTCOMES = Counter(
    "vk_ingestion_ack_reconciliation_total",
    "Ingestion ACK reconciliation outcomes",
    ["outcome"],
)


@dataclass(frozen=True, slots=True)
class ReconciliationStats:
    candidates: int
    found: int
    repaired: int
    missing: int
    missing_references: int
    expired_claims: int
    quarantined_batches: int


class IngestionAckReconciler:
    def __init__(self, *, session_factory: async_sessionmaker, client: ContentIngestionReceiptClient) -> None:
        self._session_factory = session_factory
        self._client = client

    async def run_once(self) -> ReconciliationStats:
        now = datetime.now(UTC)
        cutoff = now - timedelta(seconds=settings.ingestion_ack_reconciliation_min_age_seconds)
        async with self._session_factory() as session:
            async with session.begin():
                local = await repair_local_lifecycle(
                    session,
                    now=now,
                    limit=settings.ingestion_ack_reconciliation_batch_size,
                )
                candidate_ids = await pending_ack_message_ids(
                    session,
                    older_than=cutoff,
                    limit=settings.ingestion_ack_reconciliation_batch_size,
                )
                await observe_lifecycle_snapshot(session, now=now)
        _record_local_repair(local)
        acks = await self._client.fetch_applied(candidate_ids)
        repaired = 0
        for ack in acks:
            async with self._session_factory() as session:
                async with session.begin():
                    outcome = await SqlAlchemyIngestionAckRepository(session).apply(
                        ack, received_at=datetime.now(UTC)
                    )
            RECONCILIATION_OUTCOMES.labels(outcome=outcome).inc()
            if outcome in {"applied", "batch_applied", "replayed"}:
                repaired += 1
        missing = len(candidate_ids) - len(acks)
        if missing:
            RECONCILIATION_OUTCOMES.labels(outcome="missing").inc(missing)
        return ReconciliationStats(
            len(candidate_ids), len(acks), repaired, missing,
            local.missing_references, local.expired_claims, local.quarantined_batches,
        )


def _record_local_repair(local) -> None:
    for outcome, count in (
        ("missing_reference_repaired", local.missing_references),
        ("expired_claim_released", local.expired_claims),
        ("local_inconsistency_quarantined", local.quarantined_batches),
    ):
        if count:
            RECONCILIATION_OUTCOMES.labels(outcome=outcome).inc(count)


async def reconcile_ingestion_acks_forever(session_factory: async_sessionmaker) -> None:
    client = ContentIngestionReceiptClient(
        base_url=settings.content_service_base_url,
        internal_token=settings.internal_service_token,
    )
    reconciler = IngestionAckReconciler(session_factory=session_factory, client=client)
    while True:
        await reconciler.run_once()
        await asyncio.sleep(settings.ingestion_ack_reconciliation_poll_seconds)
