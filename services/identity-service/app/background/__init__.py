"""Background workers for identity-service."""

import asyncio
import logging
from collections.abc import AsyncGenerator, Callable
from contextlib import asynccontextmanager, suppress

from common.runtime import WorkerHealth, supervise
from fastapi import FastAPI

from app.background.outbox_worker import publish_outbox_forever
from app.core.config import settings

logger = logging.getLogger(__name__)

__all__ = ["create_lifespan"]


def create_lifespan(
    outbox_health: WorkerHealth,
) -> Callable[[FastAPI], AsyncGenerator[None, None]]:
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
        tasks: list[asyncio.Task] = []
        if settings.outbox_publish_enabled:
            tasks.append(asyncio.create_task(
                supervise("Outbox publisher", lambda: publish_outbox_forever(outbox_health), health=outbox_health)
            ))
        else:
            logger.info("Identity outbox publisher disabled by configuration")
        try:
            yield
        finally:
            for t in tasks:
                t.cancel()
                with suppress(asyncio.CancelledError):
                    await t
    return lifespan
