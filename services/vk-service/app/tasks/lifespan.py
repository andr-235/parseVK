import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from common.runtime import WorkerHealth
from common.runtime import supervise as supervise_worker
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.bootstrap import (
    get_provider_account_repository,
    get_secret_provider,
    get_vk_client,
)
from app.core.config import settings
from app.domain.exceptions.vk_api import VkApiAuthError
from app.infrastructure.db.session import SessionLocal
from app.tasks import (
    TaskCancellationEventsConsumer,
    TaskEventsConsumer,
    publish_outbox_forever,
)
from app.tasks.provider_reconciliation import reconcile_provider_account
from app.tasks.startup_checks import schedule_startup_checks
from app.tasks.task_runtime import build_execution_worker
from app.tasks.vk_commands_consumer import VkExecutionCommandsConsumer

logger = logging.getLogger(__name__)

_consumer_healthy: list[bool] = [False]
_publisher_healthy: list[bool] = [False]
_execution_worker_health = WorkerHealth()


async def supervise(
    name: str,
    coro_factory,
    health_flag: list[bool] | None = None,
):
    retry_delay = 1
    while True:
        try:
            if health_flag is not None:
                health_flag[0] = True
            await coro_factory()
            break
        except asyncio.CancelledError:
            logger.info("%s cancelled, stopping supervise", name)
            if health_flag is not None:
                health_flag[0] = False
            break
        except VkApiAuthError as error:
            logger.critical(
                "%s failed with VK API auth error [%d]: %s. Stopping retries.",
                name,
                error.code,
                error.error_msg,
            )
            if health_flag is not None:
                health_flag[0] = False
            break
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    display_version = ""
    try:
        credential = get_secret_provider().load()
        if credential.raw_secret:
            display_version = credential.display_version
    except Exception:
        pass
    logger.info(
        "VK service starting, token=%s",
        display_version or "(not set)",
    )
    schedule_startup_checks()

    async def run_startup_reconciliation():
        async with SessionLocal.begin() as session:
            return await reconcile_provider_account(
                get_vk_client(),
                get_secret_provider(),
                get_provider_account_repository(session),
            )

    try:
        await run_startup_reconciliation()
    except Exception as error:
        logger.error("startup reconciliation failed: %s", error)

    session_factory: async_sessionmaker = SessionLocal
    consumers = []
    background_tasks: list[asyncio.Task] = []

    if settings.kafka_consumer_enabled:
        if settings.vk_commands_consumer_enabled:
            consumers.extend(
                (
                    (
                        "VK command consumer",
                        VkExecutionCommandsConsumer(
                            session_factory=session_factory
                        ),
                    ),
                    (
                        "Task cancellation consumer",
                        TaskCancellationEventsConsumer(
                            session_factory=session_factory
                        ),
                    ),
                )
            )
        elif settings.legacy_task_events_enabled:
            consumers.append(
                (
                    "Legacy task-events consumer",
                    TaskEventsConsumer(session_factory=session_factory),
                )
            )
        else:
            logger.warning(
                "Kafka consumer enabled but no VK command path is active"
            )
    else:
        logger.info("VK Kafka consumers disabled by configuration")

    for name, consumer in consumers:
        background_tasks.append(
            asyncio.create_task(
                supervise(
                    name,
                    consumer.run_forever,
                    health_flag=_consumer_healthy,
                )
            )
        )

    if settings.outbox_publish_enabled:
        background_tasks.append(
            asyncio.create_task(
                supervise(
                    "Outbox publisher",
                    lambda: publish_outbox_forever(session_factory),
                    health_flag=_publisher_healthy,
                )
            )
        )
    else:
        logger.info("VK outbox publisher disabled by configuration")

    if settings.task_worker_enabled:
        execution_worker = build_execution_worker(
            session_factory,
            _execution_worker_health,
        )
        background_tasks.append(
            asyncio.create_task(
                supervise_worker(
                    "VK execution worker",
                    execution_worker.run_forever,
                    health=_execution_worker_health,
                )
            )
        )
    else:
        logger.info("VK execution worker disabled by configuration")

    try:
        yield
    finally:
        for task in background_tasks:
            task.cancel()
        for task in background_tasks:
            with suppress(asyncio.CancelledError):
                await task
        for _, consumer in consumers:
            await consumer.stop()


def get_consumer_healthy() -> bool:
    return _consumer_healthy[0]


def get_publisher_healthy() -> bool:
    return _publisher_healthy[0]


def get_execution_worker_healthy() -> bool:
    return _execution_worker_health.is_healthy
