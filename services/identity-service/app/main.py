import logging

from common.runtime import WorkerHealth
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.background import create_lifespan
from app.core.config import settings
from app.modules.auth.router import router as auth_router
from app.modules.users.admin_router import router as admin_router

logger = logging.getLogger(__name__)

_publisher_health: WorkerHealth = WorkerHealth()

lifespan = create_lifespan(_publisher_health)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    try:
        from common.tracing import setup_opentelemetry
        setup_opentelemetry("identity-service")
    except Exception:
        pass

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {
            "status": "UP",
            "outboxPublisher": "healthy" if _publisher_health.is_healthy else "unhealthy",
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
            raise HTTPException(
                status_code=503, detail=f"Database is not ready: {str(e)}"
            ) from None

    app.include_router(auth_router)
    app.include_router(admin_router)

    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
