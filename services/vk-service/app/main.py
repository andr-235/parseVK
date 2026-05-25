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


from app.modules.vk_api.router import router as vk_router
from app.modules.vk_friends.router import router as vk_friends_router
from app.modules.ok_friends.router import router as ok_friends_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    app.include_router(vk_router)
    app.include_router(vk_friends_router)
    app.include_router(ok_friends_router)
    return app


app = create_app()
