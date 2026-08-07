import asyncio
import logging
from contextlib import suppress
from dataclasses import dataclass

from common.runtime import WorkerHealth
from common.runtime import supervise as supervise_worker
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import settings
from app.domain.exceptions.vk_api import VkApiAuthError
from app.tasks import publish_outbox_forever
from app.tasks.staged_part_publisher import publish_staged_parts_forever
from app.tasks.task_runtime import build_execution_worker
from app.tasks.vk_commands_consumer import VkExecutionCommandsConsumer

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class BackgroundRuntime:
    tasks: list[asyncio.Task]
    consumers: list[VkExecutionCommandsConsumer]

    async def stop(self) -> None:
        for task in self.tasks:
            task.cancel()
        for task in self.tasks:
            with suppress(asyncio.CancelledError):
                await task
        for consumer in self.consumers:
            await consumer.stop()


async def supervise(
    name: str,
    coro_factory,
    health_flag: list[bool] | None = None,
) -> None:
    retry_delay = 1
    while True:
        try:
            if health_flag is not None:
                health_flag[0] = True
            await coro_factory()
            return
        except asyncio.CancelledError:
            logger.info("%s cancelled, stopping supervise", name)
            if health_flag is not None:
                health_flag[0] = False
            return
        except VkApiAuthError as error:
            logger.critical(
                "%s failed with VK API auth error [%d]: %s. Stopping retries.",
                name,
                error.code,
                error.error_msg,
            )
            if health_flag is not None:
                health_flag[0] = False
            return
        except Exception as error:
            if health_flag is not None:
                health_flag[0] = False
            logger.error(
                "%s crashed: %s. Restarting in %ds...",
                name,
                error,
                retry_delay,
            )
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 30)


def start_background_runtime(
    session_factory: async_sessionmaker,
    *,
    consumer_health: list[bool],
    outbox_health: list[bool],
    staged_publisher_health: list[bool],
    execution_health: WorkerHealth,
) -> BackgroundRuntime:
    tasks: list[asyncio.Task] = []
    consumers: list[VkExecutionCommandsConsumer] = []

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

    _start_simple_worker(
        tasks,
        enabled=settings.outbox_publish_enabled,
        name="Outbox publisher",
        factory=lambda: publish_outbox_forever(session_factory),
        health=outbox_health,
    )
    _start_simple_worker(
        tasks,
        enabled=settings.staged_part_publisher_enabled,
        name="Staged ingestion part publisher",
        factory=lambda: publish_staged_parts_forever(session_factory),
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
    health: list[bool],
) -> None:
    if enabled:
        tasks.append(
            asyncio.create_task(supervise(name, factory, health_flag=health))
        )
    else:
        logger.info("%s disabled by configuration", name)
