import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from app.core.config import settings
from app.modules.outbox.publisher import publish_outbox_forever
from app.modules.tasks.consumer import TaskEventsConsumer


@asynccontextmanager
async def lifespan(app: FastAPI):
    consumer = TaskEventsConsumer()
    consumer_task = None
    publisher_task = None
    if settings.kafka_consumer_enabled:
        consumer_task = asyncio.create_task(consumer.run_forever())
    if settings.outbox_publish_enabled:
        publisher_task = asyncio.create_task(publish_outbox_forever())
    try:
        yield
    finally:
        for task in (consumer_task, publisher_task):
            if task:
                task.cancel()
        for task in (consumer_task, publisher_task):
            if task:
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
