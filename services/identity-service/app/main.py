import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from aiokafka import AIOKafkaProducer
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.modules.auth.router import router as auth_router
from app.modules.outbox.publisher import IDENTITY_EVENTS_TOPIC, OutboxPublisher
from app.modules.outbox.repository import lock_pending_batch, mark_failed_or_retry, mark_published
from app.modules.users.admin_router import router as admin_router

logger = logging.getLogger(__name__)

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
        except Exception as e:
            if health_flag is not None:
                health_flag[0] = False
            logger.error("%s crashed: %s. Restarting in %ds...", name, e, retry_delay)
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 30)


async def publish_outbox_forever():
    logger.info("Identity outbox publisher starting")
    producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
    await producer.start()
    try:
        publisher = OutboxPublisher(producer, topic=IDENTITY_EVENTS_TOPIC)
        while True:
            try:
                async with AsyncSessionLocal() as session:
                    await publisher.publish_once(session)
            except Exception:
                logger.exception("Identity outbox publish loop iteration failed")
            await asyncio.sleep(2)
    finally:
        await producer.stop()


@asynccontextmanager
async def lifespan(app: FastAPI):
    publisher_task = None
    if settings.outbox_publish_enabled:
        publisher_task = asyncio.create_task(
            supervise("Outbox publisher", publish_outbox_forever, health_flag=_publisher_healthy)
        )
    else:
        logger.info("Identity outbox publisher disabled by configuration")
    try:
        yield
    finally:
        if publisher_task:
            publisher_task.cancel()
            with suppress(asyncio.CancelledError):
                await publisher_task


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    try:
        from common.tracing import setup_opentelemetry
        setup_opentelemetry("identity-service")
    except Exception:
        pass

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {
            "status": "UP",
            "outboxPublisher": "healthy" if _publisher_healthy[0] else "unhealthy",
        }

    @app.get("/ready")
    async def ready() -> dict[str, str]:
        from fastapi import HTTPException
        from sqlalchemy import text

        from app.db.session import engine
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return {"status": "READY"}
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}")

    app.include_router(auth_router)
    app.include_router(admin_router)

    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
