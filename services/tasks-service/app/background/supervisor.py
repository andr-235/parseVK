"""Supervisor background worker for tasks-service.

Wraps a background coroutine with exponential-backoff restart on crash.
"""

import asyncio
import logging

logger = logging.getLogger(__name__)


async def supervise(
    name: str,
    coro_factory,
    health_flag: list[bool] | None = None,
) -> None:
    """Run a background coroutine with exponential backoff restart on crash.

    Args:
        name: Human-readable worker name for logging.
        coro_factory: Async callable that returns a coroutine to run.
        health_flag: Optional mutable list with one element — set to True
            while running, False on crash or cancellation.
    """
    retry_delay = 1
    while True:
        try:
            if health_flag is not None:
                health_flag[0] = True
            await coro_factory()
            break
        except asyncio.CancelledError:
            logger.info("%s cancelled, stopping supervise", name)
            if health_flag is not None:
                health_flag[0] = False
            break
        except Exception as e:
            if health_flag is not None:
                health_flag[0] = False
            logger.error(
                "%s crashed: %s. Restarting in %ds...",
                name, e, retry_delay,
            )
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 30)
