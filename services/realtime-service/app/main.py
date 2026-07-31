import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.db.session import SessionLocal as session_factory
from app.modules.retention.cleaner import catchup_loop, retention_loop
from app.modules.stream.listener import RealtimeListener
from app.routes import create_router

# Convert SQLAlchemy asyncpg DSN to plain asyncpg DSN for LISTEN/NOTIFY.
listener_dsn = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
realtime_listener = RealtimeListener(listener_dsn)

logger = logging.getLogger(__name__)

_consumer_tasks: list[asyncio.Task] = []
_consumer_healthy: list[bool] = [False]

_retention_task: asyncio.Task | None = None
_catchup_task: asyncio.Task | None = None


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
    logger.info("Realtime service starting")

    # Start shared LISTEN/NOTIFY listener
    await realtime_listener.start()

    # Start background tasks
    _retention_task = asyncio.create_task(retention_loop(session_factory))
    _catchup_task = asyncio.create_task(catchup_loop(session_factory))
    logger.info("Started retention and catch-up background tasks")

    if settings.kafka_consumer_enabled and settings.realtime_service_enabled:
        from app.modules.ingestion.ingestor import consume_topic_forever

        topics = [
            (settings.kafka_topic_content, f"{settings.kafka_consumer_group}-content"),
            (settings.kafka_topic_tasks, f"{settings.kafka_consumer_group}-tasks"),
        ]
        for topic, group in topics:
            task = asyncio.create_task(
                supervise(
                    f"consumer-{topic}",
                    lambda t=topic, g=group: consume_topic_forever(
                        session_factory,
                        topic=t,
                        bootstrap_servers=settings.kafka_bootstrap_servers,
                        consumer_group=g,
                    ),
                    health_flag=_consumer_healthy,
                )
            )
            _consumer_tasks.append(task)
            logger.info("Started consumer for topic=%s group=%s", topic, group)
    else:
        logger.info("Kafka consumer or realtime service disabled by configuration")

    try:
        yield
    finally:
        # Stop consumer tasks
        for task in _consumer_tasks:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task
        _consumer_tasks.clear()

        # Stop background tasks
        if _retention_task:
            _retention_task.cancel()
            with suppress(asyncio.CancelledError):
                await _retention_task
        if _catchup_task:
            _catchup_task.cancel()
            with suppress(asyncio.CancelledError):
                await _catchup_task

        # Stop shared listener
        await realtime_listener.stop()

        logger.info("All background tasks stopped")


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.include_router(create_router(realtime_listener, _consumer_healthy))
    Instrumentator().instrument(app).expose(app)
    return app


app = create_app()
