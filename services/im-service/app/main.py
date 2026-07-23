import asyncio
import logging
import os
from contextlib import asynccontextmanager, suppress

logging.basicConfig(level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper()))

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.modules.monitoring_groups.router import router as monitoring_groups_router
from app.modules.notifier.router import router as notifier_router
from app.modules.outbox.publisher import publish_outbox_forever
from app.modules.replay.router import router as replay_router
from app.modules.search.router import router as search_router
from app.modules.tasks.consumer import TaskEventsConsumer

logger = logging.getLogger(__name__)

_consumer_healthy: list[bool] = [False]
_publisher_healthy: list[bool] = [False]
_notifier_healthy: list[bool] = [False]
_poller_healthy: list[bool] = [False]


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


@asynccontextmanager
async def lifespan(app: FastAPI):
    consumer = TaskEventsConsumer()
    consumer_task = None
    publisher_task = None
    notifier_task = None

    async def run_consumer():
        await consumer.run_forever()

    async def run_publisher():
        await publish_outbox_forever()

    async def run_notifier():
        from app.db.session import SessionLocal
        from app.modules.notifier.repository import NotifierRepository
        from app.modules.notifier.service import run_notifier_forever

        async with SessionLocal() as session:
            repository = NotifierRepository(session)
            await run_notifier_forever(repository, poll_interval=settings.notifier_poll_interval)

    async def run_poller():
        from app.db.session import SessionLocal
        from app.modules.poller.service import run_poller_forever

        await run_poller_forever(SessionLocal, poll_interval=settings.wappi_poll_interval)

    if settings.kafka_consumer_enabled:
        consumer_task = asyncio.create_task(
            supervise("Kafka consumer", run_consumer, health_flag=_consumer_healthy)
        )
    if settings.outbox_publish_enabled:
        publisher_task = asyncio.create_task(
            supervise("Outbox publisher", run_publisher, health_flag=_publisher_healthy)
        )
    notifier_task = asyncio.create_task(
        supervise("Notifier", run_notifier, health_flag=_notifier_healthy)
    )
    poller_task = asyncio.create_task(
        supervise("WappiPoller", run_poller, health_flag=_poller_healthy)
    )
    try:
        yield
    finally:
        for task in (consumer_task, publisher_task, notifier_task, poller_task):
            if task:
                task.cancel()
        for task in (consumer_task, publisher_task, notifier_task, poller_task):
            if task:
                with suppress(asyncio.CancelledError):
                    await task
        await consumer.stop()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    try:
        from common.tracing import setup_opentelemetry
        setup_opentelemetry("im-service")
    except Exception:
        pass

    app.include_router(monitoring_groups_router)
    app.include_router(search_router)
    app.include_router(notifier_router)
    app.include_router(replay_router)

    @app.get("/health")
    async def health() -> dict[str, str]:
        result: dict[str, str] = {"status": "UP"}
        if settings.kafka_consumer_enabled:
            result["kafkaConsumer"] = "healthy" if _consumer_healthy[0] else "unhealthy"
        if settings.outbox_publish_enabled:
            result["outboxPublisher"] = "healthy" if _publisher_healthy[0] else "unhealthy"
        result["notifier"] = "healthy" if _notifier_healthy[0] else "unhealthy"
        result["poller"] = "healthy" if _poller_healthy[0] else "unhealthy"
        return result

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

    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
