from __future__ import annotations

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.db.models import ProcessedEvent
from app.db.session import SessionLocal
from app.modules.ingestion.canonical_repository import CanonicalIngestionRepository
from app.modules.ingestion.contract import IngressValidationError, parse_ingestion_part
from app.modules.ingestion.receipt_repository import IngestionReceiptRepository
from app.modules.ingestion.service import IngestionApplicationService
from app.modules.projections.outbox_service import ContentOutboxService
from common.kafka.consumer import BaseEventConsumer


class VkIngestionConsumer(BaseEventConsumer):
    consumer_group = "content-service-vk-ingestion"
    consumer_name = "content-service-vk-ingestion-retry"
    dlq_topic = settings.kafka_topic_vk_ingestion_dlq

    def __init__(self, *, session_factory: async_sessionmaker | None = None):
        self.max_consumer_retries = settings.kafka_vk_ingestion_max_retries
        super().__init__(
            session_factory=session_factory or SessionLocal,
            kafka_topic=settings.kafka_topic_vk_ingestion,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            model_class=ProcessedEvent,
            fetch_max_bytes=settings.kafka_vk_ingestion_fetch_max_bytes,
            max_partition_fetch_bytes=settings.kafka_vk_ingestion_max_partition_fetch_bytes,
        )

    async def handle_record(self, message) -> None:
        part = parse_ingestion_part(message.value, message.headers)
        async with self.session_factory() as session:
            async with session.begin():
                service = IngestionApplicationService(
                    IngestionReceiptRepository(session),
                    CanonicalIngestionRepository(session),
                    ContentOutboxService(session),
                )
                await service.apply(part)

    async def handle_message(self, raw_value: bytes) -> None:
        raise IngressValidationError("staged ingestion requires Kafka metadata headers")
