"""Supervisor background worker for common runtime.

Wraps a background coroutine with exponential-backoff restart on crash.
Workers report their own cycle health via WorkerHealth.mark_cycle_success()
and mark_cycle_error(). The supervisor only marks start, crash, and stop.
"""

import asyncio
import logging
from collections.abc import Awaitable, Callable

from common.runtime.health import WorkerHealth

logger = logging.getLogger(__name__)


async def supervise(
    name: str,
    coro_factory: Callable[[], Awaitable[None]],
    health: WorkerHealth | None = None,
) -> None:
    """Run a background coroutine with exponential backoff restart on crash.

    The supervisor manages lifecycle at the worker level:
    - Calls mark_started() before running the worker
    - On unhandled exception: calls mark_crashed(), restarts with backoff
    - On CancelledError: calls mark_stopped() and re-raises

    The worker is responsible for reporting its own cycle-level health
    via mark_cycle_success() and mark_cycle_error().

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
            break
        except asyncio.CancelledError:
            logger.info("%s cancelled, stopping supervise", name)
            if health is not None:
                health.mark_stopped()
            raise
        except Exception as e:
            if health is not None:
                health.mark_crashed(str(e))
            logger.error(
                "%s crashed: %s. Restarting in %ds...",
                name, e, retry_delay,
            )
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 30)
