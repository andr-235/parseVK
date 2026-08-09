from __future__ import annotations

from datetime import UTC, datetime

from aiokafka.structs import ConsumerRecord
from common.kafka.consumer import BaseEventConsumer
from prometheus_client import Counter

from app.core.config import settings
from app.infrastructure.db.models.tasks import ProcessedEvent
from app.infrastructure.db.repositories.ingestion_ack import (
    SqlAlchemyIngestionAckRepository,
)
from app.infrastructure.db.repositories.tasks import SqlAlchemyTaskEventsRepository
from app.services.ingestion.ack_contract import decode_ingestion_ack

ACK_OUTCOMES = Counter(
    "vk_ingestion_ack_outcomes_total",
    "Durable ingestion ACK processing outcomes",
    ["outcome"],
)


class VkIngestionAckConsumer(BaseEventConsumer):
    consumer_group = "vk-service-ingestion-ack"
    consumer_name = "vk-service-ingestion-ack"
    dlq_topic = settings.kafka_topic_vk_ingestion_ack_dlq
    auto_offset_reset = "earliest"

    def __init__(self, *, session_factory):
        super().__init__(
            session_factory=session_factory,
            kafka_topic=settings.kafka_topic_vk_ingestion_ack,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            model_class=ProcessedEvent,
        )

    async def handle_record(self, message: ConsumerRecord) -> None:
        await self._handle(message.value, message.headers or [])

    async def handle_message(self, raw_value: bytes) -> None:
        await self._handle(raw_value, [])

    async def _handle(
        self,
        raw_value: bytes,
        headers: list[tuple[str, bytes | None]],
    ) -> None:
        ack = decode_ingestion_ack(raw_value, headers)
        async with self.session_factory() as session:
            async with session.begin():
                inbox = SqlAlchemyTaskEventsRepository(session)
                if await inbox.is_successfully_processed(
                    self.consumer_name,
                    ack.ack_event_id,
                ):
                    ACK_OUTCOMES.labels(outcome="inbox_replay").inc()
                    return
                outcome = await SqlAlchemyIngestionAckRepository(session).apply(
                    ack,
                    received_at=datetime.now(UTC),
                )
                await inbox.mark_processed(
                    self.consumer_name,
                    ack.ack_event_id,
                    "content.ingestion.part-applied",
                )
                ACK_OUTCOMES.labels(outcome=outcome).inc()
