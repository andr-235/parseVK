import logging

from fastapi import FastAPI

from app.api.router_registry import register_routers
from app.core.config import mask_token, settings
from app.tasks.lifespan import (
    get_consumer_healthy,
    get_publisher_healthy,
    get_task_worker_healthy,
    lifespan,
)

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    try:
        from common.tracing import setup_opentelemetry

        setup_opentelemetry("vk-service")
    except Exception:
        pass

    @app.get("/health")
    async def health() -> dict[str, str]:
        vk_token_configured = "yes" if settings.vk_token else "no"
        ok_creds_configured = (
            "yes"
            if (
                settings.ok_access_token
                and settings.ok_application_key
                and settings.ok_application_secret_key
            )
            else "no"
        )
        return {
            "status": "UP",
            "vkTokenConfigured": vk_token_configured,
            "vkTokenMasked": mask_token(settings.vk_token) if settings.vk_token else "",
            "okCredentialsConfigured": ok_creds_configured,
            "okTokenMasked": mask_token(settings.ok_access_token)
            if settings.ok_access_token
            else "",
            "kafkaConsumer": "healthy" if get_consumer_healthy() else "unhealthy",
            "outboxPublisher": "healthy" if get_publisher_healthy() else "unhealthy",
            "taskWorker": "healthy" if get_task_worker_healthy() else "unhealthy",
        }

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
            raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}") from e

    register_routers(app)

    from prometheus_fastapi_instrumentator import Instrumentator

    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
