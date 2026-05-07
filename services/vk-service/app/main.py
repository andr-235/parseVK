import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from app.core.config import settings
from app.modules.tasks.consumer import TaskEventsConsumer


@asynccontextmanager
async def lifespan(app: FastAPI):
    consumer = TaskEventsConsumer()
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

    return app


app = create_app()
