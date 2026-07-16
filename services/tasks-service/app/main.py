"""FastAPI application factory for tasks-service."""

from common.runtime import WorkerHealth
from fastapi import FastAPI, HTTPException
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import text

from app.background import create_lifespan
from app.core.exception_handlers import register_exception_handlers
from app.modules.automation.router import router as automation_router
from app.modules.tasks.router import router as tasks_router

_outbox_publisher_health: WorkerHealth = WorkerHealth()
_automation_scheduler_health: WorkerHealth = WorkerHealth()

lifespan = create_lifespan(_outbox_publisher_health, _automation_scheduler_health)


def create_app() -> FastAPI:
    """Create and configure the tasks-service FastAPI application.

    Registers routers, health/ready endpoints, exception handlers, Prometheus
    instrumentation, and the lifespan that manages background workers.

    Returns:
        Configured FastAPI application instance.
    """
    app = FastAPI(title="parseVK Tasks Service", lifespan=lifespan)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {
            "status": "UP",
            "outboxPublisher": "healthy" if _outbox_publisher_health.is_healthy else "unhealthy",
            "automationScheduler": "healthy" if _automation_scheduler_health.is_healthy else "unhealthy",
        }

    @app.get("/ready")
    async def ready() -> dict[str, str]:
        from app.db.session import engine
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return {"status": "READY"}
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}") from e

    app.include_router(automation_router)
    app.include_router(tasks_router)
    register_exception_handlers(app)
    Instrumentator().instrument(app).expose(app)
    return app


app = create_app()
