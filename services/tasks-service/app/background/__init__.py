"""Background workers for tasks-service.

Workers are long-running asyncio tasks that run in the background:
- publish_outbox_forever: periodically publishes outbox events to Kafka
- run_automation_scheduler_forever: periodically checks due automation settings
- supervise: wraps a worker with exponential backoff restart on crash
"""

import asyncio
from collections.abc import AsyncGenerator, Callable
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from app.background.automation_worker import run_automation_scheduler_forever
from app.background.outbox_worker import publish_outbox_forever
from app.background.supervisor import supervise
from app.core.config import settings

__all__ = [
    "create_lifespan",
    "publish_outbox_forever",
    "run_automation_scheduler_forever",
    "supervise",
]


def create_lifespan(
    outbox_flag: list[bool],
    automation_flag: list[bool],
) -> Callable[[FastAPI], AsyncGenerator[None, None]]:
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
        tasks: list[asyncio.Task] = []
        if settings.outbox_publish_enabled:
            tasks.append(asyncio.create_task(supervise("Outbox publisher", publish_outbox_forever, health_flag=outbox_flag)))
        if settings.automation_scheduler_enabled:
            tasks.append(asyncio.create_task(supervise("Automation scheduler", run_automation_scheduler_forever, health_flag=automation_flag)))
        try:
            yield
        finally:
            for t in tasks:
                t.cancel()
                with suppress(asyncio.CancelledError):
                    await t
    return lifespan
