from contextlib import asynccontextmanager

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.content.router import router as content_router
from app.api.health import router as health_router
from app.api.monitoring.router import router as monitoring_router
from app.bootstrap import ContentContainer
from app.core.config import settings
from app.tasks import ProjectionWorkers


@asynccontextmanager
async def lifespan(app: FastAPI):
    container = ContentContainer()
    app.state.container = container
    workers = ProjectionWorkers()
    app.state.workers = workers
    if settings.kafka_consumer_enabled:
        workers.start()
    try:
        yield
    finally:
        await workers.stop()
        await container.close()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.include_router(health_router)
    app.include_router(content_router)
    app.include_router(monitoring_router)

    Instrumentator().instrument(app).expose(app)

    return app


app = create_app()
