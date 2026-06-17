import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.modules.content.router import router as content_router
<<<<<<< HEAD
from app.modules.listings.router import router as listings_router
from app.modules.telegram_tgmbase.router import router as telegram_tgmbase_router
from app.modules.projections.consumer import ProjectionConsumer
from app.modules.im_events.consumer import ImEventConsumer
=======
from app.modules.im_events.consumer import ImEventConsumer
from app.modules.projections.consumer import ProjectionConsumer
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


@asynccontextmanager
async def lifespan(app: FastAPI):
    vk_consumer = ProjectionConsumer()
    im_consumer = ImEventConsumer()
    vk_task = None
    im_task = None
    if settings.kafka_consumer_enabled:
        vk_task = asyncio.create_task(vk_consumer.run_forever())
        im_task = asyncio.create_task(im_consumer.run_forever())
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

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    @app.get("/ready")
    async def ready() -> dict[str, str]:
<<<<<<< HEAD
        from app.db.session import engine
        from sqlalchemy import text
        from fastapi import HTTPException
=======
        from fastapi import HTTPException
        from sqlalchemy import text

        from app.db.session import engine
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return {"status": "READY"}
        except Exception as e:
<<<<<<< HEAD
            raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}")
=======
            raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}") from e
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

    from app.modules.monitoring.router import router as monitoring_router

    app.include_router(content_router)
    app.include_router(monitoring_router)

    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
