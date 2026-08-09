import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.modules.moderation.consumer import ProjectionConsumer, TaskLifecycleConsumer
from app.modules.moderation.router import router as moderation_router
from app.modules.photo_analysis.router import router as photo_analysis_router

logger = logging.getLogger(__name__)

_content_consumer_healthy: list[bool] = [False]
_tasks_consumer_healthy: list[bool] = [False]


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
    from app.db.session import async_session_maker
    from app.modules.keywords.recalculation import RecalculationWorker

    worker = RecalculationWorker(async_session_maker)
    try:
        cleaned_count = await worker.cleanup_stale_jobs()
        if cleaned_count > 0:
            logger.info("Cleaned up %d stale recalculation jobs on startup", cleaned_count)
    except Exception:
        logger.exception("Failed to cleanup stale recalculation jobs on startup")

    from app.modules.watchlist.monitor import publish_watchlist_monitor_forever

    content_consumer = ProjectionConsumer()
    tasks_consumer = TaskLifecycleConsumer()
    consumer_tasks: list[asyncio.Task] = []
    if settings.kafka_consumer_enabled:
        consumer_tasks.extend(
            [
                asyncio.create_task(
                    supervise(
                        "Content Kafka consumer",
                        content_consumer.run_forever,
                        health_flag=_content_consumer_healthy,
                    )
                ),
                asyncio.create_task(
                    supervise(
                        "Tasks Kafka consumer",
                        tasks_consumer.run_forever,
                        health_flag=_tasks_consumer_healthy,
                    )
                ),
            ]
        )
    else:
        logger.info("Moderation Kafka consumers disabled by configuration")

    monitor_task = asyncio.create_task(
        publish_watchlist_monitor_forever(async_session_maker)
    )

    try:
        yield
    finally:
        for task in consumer_tasks:
            task.cancel()
        for task in consumer_tasks:
            with suppress(asyncio.CancelledError):
                await task
        monitor_task.cancel()
        with suppress(asyncio.CancelledError):
            await monitor_task
        await content_consumer.stop()
        await tasks_consumer.stop()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    try:
        from common.tracing import setup_opentelemetry

        setup_opentelemetry("moderation-service")
    except Exception:
        pass

    @app.get("/health")
    async def health() -> dict[str, str]:
        result: dict[str, str] = {"status": "UP"}
        if settings.kafka_consumer_enabled:
            result["contentKafkaConsumer"] = (
                "healthy" if _content_consumer_healthy[0] else "unhealthy"
            )
            result["tasksKafkaConsumer"] = (
                "healthy" if _tasks_consumer_healthy[0] else "unhealthy"
            )
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
            raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}") from e

    from app.modules.keywords.router import router as keywords_router
    from app.modules.watchlist.router import router as watchlist_router

    app.include_router(moderation_router)
    app.include_router(keywords_router)
    app.include_router(watchlist_router)
    app.include_router(photo_analysis_router)

    Instrumentator().instrument(app).expose(app)
    return app


app = create_app()
