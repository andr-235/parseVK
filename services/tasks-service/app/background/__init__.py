"""Background workers for tasks-service.

Workers are long-running asyncio tasks that run in the background:
- publish_outbox_forever: periodically publishes outbox events to Kafka
- run_automation_scheduler_forever: periodically checks due automation settings
- supervise: wraps a worker with exponential backoff restart on crash
"""

import asyncio
from collections.abc import AsyncGenerator, Callable
from contextlib import asynccontextmanager, suppress

from common.runtime import WorkerHealth, supervise
from fastapi import FastAPI

from app.background.automation_worker import run_automation_scheduler_forever
from app.background.outbox_worker import publish_outbox_forever
from app.core.config import settings

__all__ = [
    "create_lifespan",
    "publish_outbox_forever",
    "run_automation_scheduler_forever",
]


def create_lifespan(
    outbox_health: WorkerHealth,
    automation_health: WorkerHealth,
) -> Callable[[FastAPI], AsyncGenerator[None, None]]:
    """Build a FastAPI lifespan that starts supervised background workers.

    Args:
        outbox_health: WorkerHealth instance for the outbox publisher worker.
        automation_health: WorkerHealth instance for the automation scheduler worker.

    Returns:
        An asynccontextmanager lifespan callable for FastAPI.
    """
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
        tasks: list[asyncio.Task] = []
        if settings.outbox_publish_enabled:
            tasks.append(asyncio.create_task(
                supervise("Outbox publisher", lambda: publish_outbox_forever(outbox_health), health=outbox_health)
            ))
        if settings.automation_scheduler_enabled:
            tasks.append(asyncio.create_task(
                supervise("Automation scheduler", lambda: run_automation_scheduler_forever(automation_health), health=automation_health)
            ))
        try:
            yield
        finally:
            for t in tasks:
                t.cancel()
                with suppress(asyncio.CancelledError):
                    await t
    return lifespan
