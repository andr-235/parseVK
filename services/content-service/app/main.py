import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from common.runtime import WorkerHealth, supervise
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.modules.content.router import router as content_router
from app.modules.im_events.consumer import ImEventConsumer
from app.modules.projections.consumer import ProjectionConsumer

logger = logging.getLogger(__name__)

_vk_consumer_health: WorkerHealth = WorkerHealth()
_im_consumer_health: WorkerHealth = WorkerHealth()


@asynccontextmanager
async def lifespan(app: FastAPI):
    vk_consumer = ProjectionConsumer()
    im_consumer = ImEventConsumer()
    vk_task = None
    im_task = None

    async def run_vk():
        await vk_consumer.run_forever()

    async def run_im():
        await im_consumer.run_forever()

    if settings.kafka_consumer_enabled:
        vk_task = asyncio.create_task(
            supervise("VK consumer", run_vk, health=_vk_consumer_health)
        )
        im_task = asyncio.create_task(
            supervise("IM consumer", run_im, health=_im_consumer_health)
        )
    try:
        yield
    finally:
        for task in (vk_task, im_task):
            if task:
                task.cancel()
        for task in (vk_task, im_task):
            if task:
                with suppress(asyncio.CancelledError):
                    await task
        await vk_consumer.stop()
        await im_consumer.stop()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    try:
        from common.tracing import setup_opentelemetry
        setup_opentelemetry("content-service")
    except Exception:
        pass

    @app.get("/health")
    async def health() -> dict[str, str]:
        result: dict[str, str] = {"status": "UP"}
        if settings.kafka_consumer_enabled:
            result["vkConsumer"] = "healthy" if _vk_consumer_health.is_healthy else "unhealthy"
            result["imConsumer"] = "healthy" if _im_consumer_health.is_healthy else "unhealthy"
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

    from app.modules.monitoring.router import router as monitoring_router
    from app.modules.search.router import router as search_router

    app.include_router(content_router)
    app.include_router(monitoring_router)
    app.include_router(search_router)

    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
