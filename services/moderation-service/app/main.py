import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.modules.moderation.consumer import ProjectionConsumer
from app.modules.moderation.router import router as moderation_router
from app.modules.photo_analysis.router import router as photo_analysis_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Восстановление зависших задач при старте
    from app.db.session import async_session_maker
    from app.modules.keywords.recalculation import RecalculationWorker

    worker = RecalculationWorker(async_session_maker)
    try:
        cleaned_count = await worker.cleanup_stale_jobs()
        if cleaned_count > 0:
            print(f"Cleaned up {cleaned_count} stale recalculation jobs on startup")
    except Exception as e:
        print(f"Failed to cleanup stale recalculation jobs on startup: {e}")

    from app.modules.watchlist.monitor import publish_watchlist_monitor_forever

    consumer = ProjectionConsumer()
    task = None
    monitor_task = None
    if settings.kafka_consumer_enabled:
        task = asyncio.create_task(consumer.run_forever())

    # Запускаем фоновый мониторинг авторов watchlist
    monitor_task = asyncio.create_task(publish_watchlist_monitor_forever(async_session_maker))

    try:
        yield
    finally:
        if task:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task
        if monitor_task:
            monitor_task.cancel()
            with suppress(asyncio.CancelledError):
                await monitor_task
        await consumer.stop()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

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
