import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.automation.router import router as automation_router
from app.modules.outbox.publisher import OutboxPublisher
from app.modules.tasks.router import router as tasks_router

logger = logging.getLogger(__name__)


async def publish_outbox_forever() -> None:
    while True:
        try:
            async with SessionLocal() as session:
                async with session.begin():
                    await OutboxPublisher(session).publish_batch()
        except Exception:
            logger.exception("tasks outbox publish loop failed")
        await asyncio.sleep(2)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = None
    if settings.outbox_publish_enabled:
        task = asyncio.create_task(publish_outbox_forever())
    try:
        yield
    finally:
        if task:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK Tasks Service", lifespan=lifespan)

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
            raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}")

    app.include_router(automation_router)
    app.include_router(tasks_router)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "type": type(exc).__name__},
        )

    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
