import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from common.runtime import WorkerHealth
from common.runtime import supervise as supervise_worker
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import mask_token, settings
from app.domain.exceptions.vk_api import VkApiAuthError
from app.infrastructure.db.session import SessionLocal
from app.tasks import TaskEventsConsumer, publish_outbox_forever
from app.tasks.startup_checks import schedule_startup_checks
from app.tasks.task_runtime import build_task_worker

logger = logging.getLogger(__name__)

_consumer_healthy: list[bool] = [False]
_publisher_healthy: list[bool] = [False]
_task_worker_health = WorkerHealth()


async def supervise(name: str, coro_factory, health_flag: list[bool] | None = None):
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
                "%s failed with VK API auth error [%d]: %s. "
                "VK application token may be blocked or invalid. Stopping retries.",
                name,
                error.code,
                error.error_msg,
            )
            if health_flag is not None:
                health_flag[0] = False
            break
        except Exception as e:
            if health_flag is not None:
                health_flag[0] = False
            logger.error("%s crashed: %s. Restarting in %ds...", name, e, retry_delay)
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "VK service starting, token=%s",
        mask_token(settings.vk_token) if settings.vk_token else "(not set)",
    )
    schedule_startup_checks()

    session_factory: async_sessionmaker = SessionLocal
    consumer = TaskEventsConsumer(session_factory=session_factory)
    consumer_task = None
    publisher_task = None
    task_worker_task = None

    async def run_consumer():
        await consumer.run_forever()

    async def run_publisher():
        await publish_outbox_forever(session_factory)

    if settings.kafka_consumer_enabled:
        consumer_task = asyncio.create_task(
            supervise("Kafka consumer", run_consumer, health_flag=_consumer_healthy)
        )
    else:
        logger.info("VK Kafka consumer disabled by configuration")
    if settings.outbox_publish_enabled:
        publisher_task = asyncio.create_task(
            supervise("Outbox publisher", run_publisher, health_flag=_publisher_healthy)
        )
    else:
        logger.info("VK outbox publisher disabled by configuration")
    if settings.task_worker_enabled:
        task_worker = build_task_worker(session_factory, _task_worker_health)
        task_worker_task = asyncio.create_task(
            supervise_worker("VK task worker", task_worker.run_forever, health=_task_worker_health)
        )
    else:
        logger.info("VK task worker disabled by configuration")
    try:
        yield
    finally:
        for task in (consumer_task, publisher_task, task_worker_task):
            if task:
                task.cancel()
        for task in (consumer_task, publisher_task, task_worker_task):
            if task:
                with suppress(asyncio.CancelledError):
                    await task
        await consumer.stop()


def get_consumer_healthy() -> bool:
    return _consumer_healthy[0]


def get_publisher_healthy() -> bool:
    return _publisher_healthy[0]


def get_task_worker_healthy() -> bool:
    return _task_worker_health.is_healthy
