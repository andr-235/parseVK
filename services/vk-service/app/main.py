import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.tasks import TaskEventsConsumer, publish_outbox_forever


@asynccontextmanager
async def lifespan(app: FastAPI):
    consumer = TaskEventsConsumer()
    consumer_task = None
    publisher_task = None
    if settings.kafka_consumer_enabled:
        consumer_task = asyncio.create_task(consumer.run_forever())
    if settings.outbox_publish_enabled:
        publisher_task = asyncio.create_task(publish_outbox_forever())
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

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

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
            raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}")

    app.include_router(vk_router)
    app.include_router(vk_friends_router)
    app.include_router(ok_friends_router)

    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
