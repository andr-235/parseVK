"""Pause and resume scheduling for Kafka retry backoff."""

import asyncio
import logging

logger = logging.getLogger(__name__)


class PartitionResumeScheduler:
    def __init__(self) -> None:
        self._tasks: set[asyncio.Task] = set()

    def pause_until(self, consumer, partition, delay: float) -> None:
        consumer.pause(partition)
        task = asyncio.create_task(self._resume(consumer, partition, delay))
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def cancel(self) -> None:
        for task in self._tasks:
            task.cancel()
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()

    @staticmethod
    async def _resume(consumer, partition, delay: float) -> None:
        await asyncio.sleep(delay)
        try:
            consumer.resume(partition)
            logger.info("Resumed partition %s after retry backoff", partition)
        except Exception:
            logger.exception("Failed to resume partition %s", partition)
