import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.modules.outbox.publisher import publish_outbox_forever
from app.modules.tasks.consumer import TaskEventsConsumer

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

    async def run_consumer():
        await consumer.run_forever()

    async def run_publisher():
        await publish_outbox_forever()

    if settings.kafka_consumer_enabled:
        consumer_task = asyncio.create_task(
            supervise("Kafka consumer", run_consumer, health_flag=_consumer_healthy)
        )
    if settings.outbox_publish_enabled:
        publisher_task = asyncio.create_task(
            supervise("Outbox publisher", run_publisher, health_flag=_publisher_healthy)
        )
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


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    try:
        from common.tracing import setup_opentelemetry
        setup_opentelemetry("im-service")
    except Exception:
        pass

    @app.get("/health")
    async def health() -> dict[str, str]:
        result: dict[str, str] = {"status": "UP"}
        if settings.kafka_consumer_enabled:
            result["kafkaConsumer"] = "healthy" if _consumer_healthy[0] else "unhealthy"
        if settings.outbox_publish_enabled:
            result["outboxPublisher"] = "healthy" if _publisher_healthy[0] else "unhealthy"
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
