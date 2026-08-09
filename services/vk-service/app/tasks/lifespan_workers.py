import asyncio
import logging

from common.kafka.consumer import BaseEventConsumer
from common.runtime import WorkerHealth
from common.runtime import supervise as supervise_worker
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.tasks import publish_outbox_forever
from app.tasks.ingestion_ack_consumer import VkIngestionAckConsumer
from app.tasks.ingestion_ack_reconciliation import reconcile_ingestion_acks_forever
from app.tasks.runtime_supervision import BackgroundRuntime, supervise
from app.tasks.staged_part_publisher import publish_staged_parts_forever
from app.tasks.task_runtime import build_execution_worker
from app.tasks.vk_commands_consumer import VkExecutionCommandsConsumer

logger = logging.getLogger(__name__)


def start_background_runtime(
    session_factory: async_sessionmaker,
    *,
    consumer_health: list[bool],
    ack_health: list[bool],
    outbox_health: list[bool],
    staged_publisher_health: list[bool],
    execution_health: WorkerHealth,
) -> BackgroundRuntime:
    tasks: list[asyncio.Task] = []
    consumers: list[BaseEventConsumer] = []

    if settings.kafka_consumer_enabled:
        consumer = VkExecutionCommandsConsumer(session_factory=session_factory)
        consumers.append(consumer)
        tasks.append(
            asyncio.create_task(
                supervise(
                    "VK command consumer",
                    consumer.run_forever,
                    health_flag=consumer_health,
                )
            )
        )
    else:
        logger.info("VK command consumer disabled by configuration")

    if settings.ingestion_ack_consumer_enabled:
        ack_consumer = VkIngestionAckConsumer(session_factory=session_factory)
        consumers.append(ack_consumer)
        tasks.append(
            asyncio.create_task(
                supervise(
                    "Ingestion ACK consumer",
                    ack_consumer.run_forever,
                    health_flag=ack_health,
                )
            )
        )
    else:
        logger.info("Ingestion ACK consumer disabled by configuration")

    _start_simple_worker(
        tasks,
        enabled=settings.ingestion_ack_reconciliation_enabled,
        name="Ingestion ACK reconciliation",
        factory=lambda: reconcile_ingestion_acks_forever(session_factory),
        health=None,
    )
    _start_simple_worker(
        tasks,
        enabled=settings.outbox_publish_enabled,
        name="Outbox publisher",
        factory=lambda: publish_outbox_forever(session_factory),
        health=outbox_health,
    )
    _start_staged_publisher(
        tasks,
        session_factory=session_factory,
        health=staged_publisher_health,
    )

    if settings.task_worker_enabled:
        worker = build_execution_worker(session_factory, execution_health)
        tasks.append(
            asyncio.create_task(
                supervise_worker(
                    "VK execution worker",
                    worker.run_forever,
                    health=execution_health,
                )
            )
        )
    else:
        logger.info("VK execution worker disabled by configuration")
    return BackgroundRuntime(tasks=tasks, consumers=consumers)


def _start_simple_worker(
    tasks: list[asyncio.Task],
    *,
    enabled: bool,
    name: str,
    factory,
    health: list[bool] | None,
) -> None:
    if enabled:
        tasks.append(
            asyncio.create_task(
                supervise(name, factory, health_flag=health)
            )
        )
    else:
        logger.info("%s disabled by configuration", name)


def _start_staged_publisher(
    tasks: list[asyncio.Task],
    *,
    session_factory: async_sessionmaker,
    health: list[bool],
) -> None:
    if not settings.staged_part_publisher_enabled:
        logger.info("Staged ingestion part publisher disabled by configuration")
        return
    tasks.append(
        asyncio.create_task(
            supervise(
                "Staged ingestion part publisher",
                lambda: publish_staged_parts_forever(
                    session_factory,
                    health_flag=health,
                ),
            )
        )
    )
