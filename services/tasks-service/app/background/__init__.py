"""Background workers for tasks-service.

Workers are long-running asyncio tasks that run in the background:
- publish_outbox_forever: periodically publishes outbox events to Kafka
- run_automation_scheduler_forever: periodically checks due automation settings
- consume_execution_events: consumes task.execution_* events from vk-service
- supervise: wraps a worker with exponential backoff restart on crash
"""

import asyncio
from collections.abc import AsyncGenerator, Callable
from contextlib import asynccontextmanager, suppress

from common.runtime import WorkerHealth, supervise
from fastapi import FastAPI

from app.background.automation_worker import run_automation_scheduler_forever
from app.background.outbox_worker import (
    ensure_vk_command_topics,
    publish_outbox_forever,
)
from app.core.config import settings
from app.db.session import SessionLocal
from app.modules.execution_events.consumer import consume_execution_events

__all__ = [
    "create_lifespan",
    "publish_outbox_forever",
    "run_automation_scheduler_forever",
]


def create_lifespan(
    outbox_health: WorkerHealth,
    automation_health: WorkerHealth,
    progress_consumer_health: WorkerHealth,
) -> Callable[[FastAPI], AsyncGenerator[None, None]]:
    """Build a FastAPI lifespan that starts supervised background workers."""

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
        tasks: list[asyncio.Task] = []
        if settings.outbox_publish_enabled:
            tasks.append(
                asyncio.create_task(
                    supervise(
                        "Outbox publisher",
                        lambda: publish_outbox_forever(
                            outbox_health,
                            topic_provisioner=ensure_vk_command_topics,
                        ),
                        health=outbox_health,
                    )
                )
            )
        if settings.automation_scheduler_enabled:
            tasks.append(
                asyncio.create_task(
                    supervise(
                        "Automation scheduler",
                        lambda: run_automation_scheduler_forever(
                            automation_health
                        ),
                        health=automation_health,
                    )
                )
            )
        if settings.kafka_consumer_enabled:
            tasks.append(
                asyncio.create_task(
                    supervise(
                        "Execution consumer",
                        lambda: consume_execution_events(
                            bootstrap_servers=settings.kafka_bootstrap_servers,
                            group_id="tasks-service-vk-execution-v2",
                            topic="parsevk.vk.events",
                            session_factory=SessionLocal,
                        ),
                        health=progress_consumer_health,
                    )
                )
            )
        try:
            yield
        finally:
            for task in tasks:
                task.cancel()
                with suppress(asyncio.CancelledError):
                    await task

    return lifespan
