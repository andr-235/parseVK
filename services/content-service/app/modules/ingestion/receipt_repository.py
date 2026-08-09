from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid5

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ContentOutboxEvent, ProcessedEvent
from app.modules.ingestion.contract import IngestionPartEnvelope
from app.modules.ingestion.models import ContentIngestionReceipt

RECEIPT_NAMESPACE = UUID("d60d1d3c-5ea2-4bfe-bfda-e36a7e41ef7e")
ACK_NAMESPACE = UUID("0745cb7a-1438-48af-836c-73a2b6fefc21")
PROCESSED_CONSUMER = "content-service-vk-ingestion"


def receipt_id(source_service: str, source_message_id: UUID) -> UUID:
    return uuid5(RECEIPT_NAMESPACE, f"{source_service}:{source_message_id}")


def ack_event_id(source_message_id: UUID) -> UUID:
    return uuid5(ACK_NAMESPACE, str(source_message_id))


class IngestionReceiptRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def load(self, part: IngestionPartEnvelope) -> ContentIngestionReceipt | None:
        return await self.session.scalar(
            select(ContentIngestionReceipt)
            .where(
                ContentIngestionReceipt.source_service == part.source_service,
                ContentIngestionReceipt.source_message_id == part.source_message_id,
            )
            .with_for_update()
        )

    async def create(self, part: IngestionPartEnvelope) -> ContentIngestionReceipt:
        now = datetime.now(UTC)
        row = ContentIngestionReceipt(
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
            created_at=now,
        )
        self.session.add(row)
        await self.session.flush()
        return row

    async def has_processed(self, event_id: UUID) -> bool:
        value = await self.session.scalar(
            select(ProcessedEvent.id).where(
                ProcessedEvent.consumer_name == PROCESSED_CONSUMER,
                ProcessedEvent.event_id == event_id,
            )
        )
        return value is not None

    async def ensure_processed(self, event_id: UUID, event_type: str) -> None:
        stmt = insert(ProcessedEvent).values(
            consumer_name=PROCESSED_CONSUMER,
            event_id=event_id,
            event_type=event_type,
            processed_at=datetime.now(UTC),
            retry_count=0,
        ).on_conflict_do_nothing(
            constraint="uq_processed_events_consumer_event"
        )
        await self.session.execute(stmt)

    async def get_outbox(self, event_id: UUID) -> ContentOutboxEvent | None:
        return await self.session.get(ContentOutboxEvent, event_id)

    async def get_ack(self, event_id: UUID) -> ContentOutboxEvent | None:
        return await self.get_outbox(event_id)

    async def flush(self) -> None:
        await self.session.flush()
