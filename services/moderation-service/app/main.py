import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from app.core.config import settings
from app.modules.moderation.router import router as moderation_router
from app.modules.moderation.consumer import ProjectionConsumer


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

    consumer = ProjectionConsumer()
    task = None
    if settings.kafka_consumer_enabled:
        task = asyncio.create_task(consumer.run_forever())
    try:
        yield
    finally:
        if task:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task
        await consumer.stop()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    from app.modules.keywords.router import router as keywords_router

    app.include_router(moderation_router)
    app.include_router(keywords_router)

    return app


app = create_app()
