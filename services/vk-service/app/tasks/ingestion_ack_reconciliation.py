from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from prometheus_client import Counter
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.infrastructure.db.repositories.ingestion_ack import (
    SqlAlchemyIngestionAckRepository,
)
from app.infrastructure.db.repositories.ingestion_ack_reconciliation import (
    pending_ack_message_ids,
)
from app.services.ingestion.reconciliation_client import (
    ContentIngestionReceiptClient,
)

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


class IngestionAckReconciler:
    def __init__(
        self,
        *,
        session_factory: async_sessionmaker,
        client: ContentIngestionReceiptClient,
    ) -> None:
        self._session_factory = session_factory
        self._client = client

    async def run_once(self) -> ReconciliationStats:
        cutoff = datetime.now(UTC) - timedelta(
            seconds=settings.ingestion_ack_reconciliation_min_age_seconds
        )
        async with self._session_factory() as session:
            candidate_ids = await pending_ack_message_ids(
                session,
                older_than=cutoff,
                limit=settings.ingestion_ack_reconciliation_batch_size,
            )
        acks = await self._client.fetch_applied(candidate_ids)
        repaired = 0
        for ack in acks:
            async with self._session_factory() as session:
                async with session.begin():
                    outcome = await SqlAlchemyIngestionAckRepository(session).apply(
                        ack,
                        received_at=datetime.now(UTC),
                    )
            RECONCILIATION_OUTCOMES.labels(outcome=outcome).inc()
            if outcome in {"applied", "batch_applied", "replayed"}:
                repaired += 1
        missing = len(candidate_ids) - len(acks)
        if missing:
            RECONCILIATION_OUTCOMES.labels(outcome="missing").inc(missing)
        return ReconciliationStats(
            candidates=len(candidate_ids),
            found=len(acks),
            repaired=repaired,
            missing=missing,
        )


async def reconcile_ingestion_acks_forever(
    session_factory: async_sessionmaker,
) -> None:
    client = ContentIngestionReceiptClient(
        base_url=settings.content_service_base_url,
        internal_token=settings.internal_service_token,
    )
    reconciler = IngestionAckReconciler(
        session_factory=session_factory,
        client=client,
    )
    while True:
        await reconciler.run_once()
        await asyncio.sleep(settings.ingestion_ack_reconciliation_poll_seconds)
