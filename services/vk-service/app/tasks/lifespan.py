import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import mask_token, settings
from app.domain.exceptions.vk_api import VkApiAuthError
from app.infrastructure.db.session import SessionLocal
from app.infrastructure.ok_client.client import OkApiClient
from app.infrastructure.vk_client.client import VkApiClient, VkApiConfigurationError
from app.tasks import TaskEventsConsumer, publish_outbox_forever

logger = logging.getLogger(__name__)

_consumer_healthy: list[bool] = [False]
_publisher_healthy: list[bool] = [False]


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
        except VkApiAuthError as e:
            logger.critical(
                "%s failed with VK API auth error [%d]: %s. "
                "VK application token may be blocked or invalid. "
                "Stopping retries.",
                name, e.code, e.error_msg,
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


async def _check_vk_token_at_startup() -> None:
    try:
        client = VkApiClient()
        await client._call("users.get", user_ids="1")
        logger.info("VK token test OK — token is valid")
    except VkApiAuthError as e:
        logger.critical(
            "VK token test FAILED with auth error [%d]: %s. "
            "The VK application or token is invalid/blocked.",
            e.code, e.error_msg,
        )
    except VkApiConfigurationError as e:
        logger.warning("VK token test skipped: %s", e)
    except Exception as e:
        logger.warning("VK token test could not complete: %s", e)


async def _check_ok_credentials_at_startup() -> None:
    try:
        client = OkApiClient()
        await client._call("users.getCurrentUser", fields="uid")
        logger.info("OK credentials test OK — access token is valid")
    except RuntimeError as e:
        logger.critical(
            "OK credentials test FAILED: %s. "
            "The OK application or access token may be invalid or blocked.",
            e,
        )
    except Exception as e:
        logger.warning("OK credentials test could not complete: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "VK service starting, token=%s",
        mask_token(settings.vk_token) if settings.vk_token else "(not set)",
    )
    asyncio.create_task(_check_vk_token_at_startup())
    asyncio.create_task(_check_ok_credentials_at_startup())

    session_factory: async_sessionmaker = SessionLocal
    consumer = TaskEventsConsumer(session_factory=session_factory)
    consumer_task = None
    publisher_task = None

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
    try:
        yield
    finally:
        for task in (consumer_task, publisher_task):
            if task:
                task.cancel()
        for task in (consumer_task, publisher_task):
            if task:
                with suppress(asyncio.CancelledError):
                    await task
        await consumer.stop()


def get_consumer_healthy() -> bool:
    return _consumer_healthy[0]


def get_publisher_healthy() -> bool:
    return _publisher_healthy[0]
