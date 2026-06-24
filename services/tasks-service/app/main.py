import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.automation.repository import AutomationRepository
from app.modules.automation.router import router as automation_router
from app.modules.automation.service import AutomationService
from app.modules.outbox.publisher import OutboxPublisher
from app.modules.tasks.router import router as tasks_router

logger = logging.getLogger(__name__)

_outbox_publisher_healthy: list[bool] = [False]
_automation_scheduler_healthy: list[bool] = [False]


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


async def publish_outbox_forever() -> None:
    logger.info("Tasks outbox publisher starting")
    while True:
        try:
            async with SessionLocal() as session:
                async with session.begin():
                    await OutboxPublisher(session).publish_batch()
        except Exception:
            logger.exception("tasks outbox publish loop failed")
        await asyncio.sleep(2)


async def run_automation_scheduler_forever() -> None:
    logger.info("Automation scheduler starting")
    while True:
        try:
            async with SessionLocal() as session:
                async with session.begin():
                    settings_list = await AutomationRepository(session).list_enabled_settings()
                    for s in settings_list:
                        try:
                            await AutomationService(session).check_and_run_due(s)
                        except Exception:
                            logger.exception("Automation scheduler failed for user %s", s.owner_user_id)
                    count = len(settings_list)
                    if count:
                        logger.info("Automation scheduler check: %d settings processed", count)
        except Exception:
            logger.exception("automation scheduler loop failed")
        await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    tasks: list[asyncio.Task] = []
    if settings.outbox_publish_enabled:
        tasks.append(
            asyncio.create_task(
                supervise("Outbox publisher", publish_outbox_forever, health_flag=_outbox_publisher_healthy)
            )
        )
    if settings.automation_scheduler_enabled:
        tasks.append(
            asyncio.create_task(
                supervise("Automation scheduler", run_automation_scheduler_forever, health_flag=_automation_scheduler_healthy)
            )
        )
    try:
        yield
    finally:
        for t in tasks:
            t.cancel()
            with suppress(asyncio.CancelledError):
                await t


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK Tasks Service", lifespan=lifespan)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {
            "status": "UP",
            "outboxPublisher": "healthy" if _outbox_publisher_healthy[0] else "unhealthy",
            "automationScheduler": "healthy" if _automation_scheduler_healthy[0] else "unhealthy",
        }

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
