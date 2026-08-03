import logging

from fastapi import FastAPI

from app.api.router_registry import register_routers
from app.bootstrap import get_provider_account_repository, get_secret_provider
from app.core.config import mask_token, settings
from app.core.redaction import redact_secrets
from app.domain.entities.provider_account import SYSTEM_VK_ACCOUNT_KEY
from app.infrastructure.db.session import SessionLocal
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
        vk_display = ""
        try:
            credential = get_secret_provider().load()
        except Exception:
            credential = None
        if credential is not None and credential.raw_secret:
            vk_display = credential.display_version

        account = None
        vk_account_status = "unknown"
        try:
            async with SessionLocal() as session:
                account = await get_provider_account_repository(session).get_by_key(
                    SYSTEM_VK_ACCOUNT_KEY
                )
            vk_account_status = account.status if account else "unconfigured"
        except Exception:
            pass

        provider_ready = account is not None and account.can_execute_vk
        if not settings.task_worker_enabled:
            task_worker_status = "disabled"
        elif not provider_ready:
            task_worker_status = "blocked"
        else:
            task_worker_status = (
                "healthy" if get_task_worker_healthy() else "unhealthy"
            )

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
            "status": "UP" if provider_ready else "DEGRADED",
            "vkTokenConfigured": "yes" if vk_display else "no",
            "vkTokenMasked": vk_display,
            "vkAccountStatus": vk_account_status,
            "okCredentialsConfigured": ok_creds_configured,
            "okTokenMasked": (
                mask_token(settings.ok_access_token)
                if settings.ok_access_token
                else ""
            ),
            "kafkaConsumer": (
                "healthy" if get_consumer_healthy() else "unhealthy"
            ),
            "outboxPublisher": (
                "healthy" if get_publisher_healthy() else "unhealthy"
            ),
            "taskWorker": task_worker_status,
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
        except Exception as error:
            raise HTTPException(
                status_code=503,
                detail=f"Database is not ready: {redact_secrets(error)}",
            ) from error

    register_routers(app)

    from prometheus_fastapi_instrumentator import Instrumentator

    Instrumentator().instrument(app).expose(app)
    return app


app = create_app()
