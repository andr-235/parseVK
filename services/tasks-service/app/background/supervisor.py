"""Supervisor background worker for tasks-service.

Wraps a background coroutine with exponential-backoff restart on crash.
"""

import asyncio
import logging

from app.background.health import WorkerHealth

logger = logging.getLogger(__name__)


async def supervise(
    name: str,
    coro_factory,
    health: WorkerHealth | None = None,
) -> None:
    """Run a background coroutine with exponential backoff restart on crash.

    Args:
        name: Human-readable worker name for logging.
        coro_factory: Async callable that returns a coroutine to run.
        health: Optional WorkerHealth instance for typed diagnostics.
    """
    retry_delay = 1
    while True:
        try:
            if health is not None:
                health.mark_started()
            await coro_factory()
            if health is not None:
                health.mark_success()
                logger.debug(
                    "Health updated: running=%s, last_success=%s",
                    health.running, health.last_success_at,
                )
            break
        except asyncio.CancelledError:
            logger.info("%s cancelled, stopping supervise", name)
            if health is not None:
                health.mark_stopped()
            break
        except Exception as e:
            if health is not None:
                health.mark_error(str(e))
            logger.error(
                "%s crashed: %s. Restarting in %ds...",
                name, e, retry_delay,
            )
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 30)
