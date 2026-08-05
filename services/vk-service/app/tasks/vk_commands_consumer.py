"""Kafka consumer for the single canonical VK command stream."""

import logging

from common.kafka.consumer import BaseEventConsumer
from parsevk_contracts.validation import parse_for_consume
from parsevk_contracts.vk.commands import CATALOG as VK_COMMAND_CATALOG
from parsevk_contracts.vk.commands import (
    VkExecutionCancelRequested,
    VkExecutionRequested,
)
from prometheus_client import REGISTRY, Gauge
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.infrastructure.db.models.tasks import ProcessedEvent
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.tasks import SqlAlchemyTaskEventsRepository
from app.infrastructure.metrics.vk_metrics import observe_collection_demand_attached

logger = logging.getLogger(__name__)
CONSUMER_NAME = "vk-service-vk-commands"


def _create_lag_gauge() -> Gauge:
    name = "vk_commands_consumer_lag"
    try:
        return Gauge(
            name,
            "Canonical VK command consumer lag per partition",
            ["topic", "consumer_group", "partition"],
        )
    except ValueError:
        return REGISTRY._names_to_collectors[name]  # type: ignore[return-value]


_consumer_lag = _create_lag_gauge()


class VkExecutionCommandsConsumer(BaseEventConsumer):
    consumer_group = "vk-service-vk-commands"
    consumer_name = CONSUMER_NAME
    dlq_topic = settings.kafka_topic_vk_commands_dlq
    auto_offset_reset = "earliest"

    def __init__(self, *, session_factory: async_sessionmaker):
        super().__init__(
            session_factory=session_factory,
            kafka_topic=settings.kafka_topic_vk_commands,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            model_class=ProcessedEvent,
            lag_gauge=_consumer_lag,
        )

    async def handle_message(self, raw_value: bytes) -> None:
        parsed = parse_for_consume(
            VK_COMMAND_CATALOG,
            consumer="vk-service",
            topic=settings.kafka_topic_vk_commands,
            value=raw_value,
        )
        command = parsed.envelope.payload
        attachments = ()
        outcome = "cancelled"
        async with self.session_factory() as session:
            inbox = SqlAlchemyTaskEventsRepository(session)
            repository = CanonicalVkCommandRepository(session)
            async with session.begin():
                if await inbox.is_processed(
                    self.consumer_name,
                    parsed.envelope.message_id,
                ):
                    return
                if isinstance(command, VkExecutionRequested):
                    result = await repository.attach_command(command)
                    outcome = result.outcome
                    attachments = result.attachments
                    if result.outcome == "conflict":
                        await repository.emit_rejection(
                            command,
                            result.reason or "canonical command conflict",
                        )
                elif isinstance(command, VkExecutionCancelRequested):
                    cancelled = await repository.request_cancellation(command)
                    if cancelled is None:
                        raise RuntimeError(
                            "canonical cancellation has no matching TaskRun binding"
                        )
                else:
                    raise TypeError("Unexpected VK command payload")
                await inbox.mark_processed(
                    self.consumer_name,
                    parsed.envelope.message_id,
                    parsed.envelope.message_type,
                )
        for attachment in attachments:
            observe_collection_demand_attached(
                coalesced=not attachment.collection_created
            )
        logger.info(
            "Handled VK command type=%s task_id=%s run_id=%s outcome=%s demands=%d",
            parsed.envelope.message_type,
            command.task_id,
            command.task_run_id,
            outcome,
            len(attachments),
        )
