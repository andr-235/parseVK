import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.domain.exceptions.vk_api import VkApiAuthError
from app.infrastructure.ok_client.client import OkApiClient
from app.infrastructure.vk_client.client import VkApiClient, VkApiConfigurationError
from app.tasks import TaskEventsConsumer, publish_outbox_forever

logger = logging.getLogger(__name__)

_consumer_healthy: list[bool] = [False]
_publisher_healthy: list[bool] = [False]


def _mask(value: str, keep: int = 4) -> str:
    if len(value) <= keep:
        return "****"
    return value[:keep] + "*" * min(len(value) - keep, 8)


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
        _mask(settings.vk_token) if settings.vk_token else "(not set)",
    )
    asyncio.create_task(_check_vk_token_at_startup())
    asyncio.create_task(_check_ok_credentials_at_startup())
    consumer = TaskEventsConsumer()
    consumer_task = None
    publisher_task = None

    async def run_consumer():
        await consumer.run_forever()

    async def run_publisher():
        await publish_outbox_forever()

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


from app.api.routers.ok_friends import router as ok_friends_router
from app.api.routers.vk_api import router as vk_router
from app.api.routers.vk_friends import router as vk_friends_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    try:
        from common.tracing import setup_opentelemetry
        setup_opentelemetry("vk-service")
    except Exception:
        pass

    @app.get("/health")
    async def health() -> dict[str, str]:
        vk_token_configured = "yes" if settings.vk_token else "no"
        ok_creds_configured = "yes" if (
            settings.ok_access_token and settings.ok_application_key and settings.ok_application_secret_key
        ) else "no"
        return {
            "status": "UP",
            "vkTokenConfigured": vk_token_configured,
            "vkTokenMasked": _mask(settings.vk_token) if settings.vk_token else "",
            "okCredentialsConfigured": ok_creds_configured,
            "okTokenMasked": _mask(settings.ok_access_token) if settings.ok_access_token else "",
            "kafkaConsumer": "healthy" if _consumer_healthy[0] else "unhealthy",
            "outboxPublisher": "healthy" if _publisher_healthy[0] else "unhealthy",
        }

    @app.get("/ready")
    async def ready() -> dict[str, str]:
        from fastapi import HTTPException
        from sqlalchemy import text

        from app.infrastructure.db.session import engine
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return {"status": "READY"}
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}") from e

    app.include_router(vk_router)
    app.include_router(vk_friends_router)
    app.include_router(ok_friends_router)

    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
