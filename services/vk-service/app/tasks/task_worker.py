import asyncio
import logging
from contextlib import suppress
from uuid import uuid4

from common.runtime import WorkerHealth

from app.tasks.lease_store import lease_deadline

logger = logging.getLogger("vk-service.task-worker")


class TaskWorker:
    def __init__(
        self,
        *,
        lease_store,
        executor_factory,
        concurrency: int,
        poll_seconds: float,
        lease_seconds: int,
        health: WorkerHealth,
    ):
        self.lease_store = lease_store
        self.executor_factory = executor_factory
        self.concurrency = concurrency
        self.poll_seconds = poll_seconds
        self.lease_seconds = lease_seconds
        self.health = health
        self.worker_id = f"vk-{uuid4()}"
        self._active: set[asyncio.Task] = set()

    async def run_forever(self) -> None:
        logger.info(
            "[FIX:274] VK task worker starting worker=%s concurrency=%s",
            self.worker_id,
            self.concurrency,
        )
        try:
            while True:
                self._collect_finished()
                claimed = await self._fill_capacity()
                self.health.mark_cycle_success()
                if not claimed:
                    await asyncio.sleep(self.poll_seconds)
        finally:
            for task in self._active:
                task.cancel()
            if self._active:
                await asyncio.gather(*self._active, return_exceptions=True)

    async def _fill_capacity(self) -> bool:
        claimed_any = False
        while len(self._active) < self.concurrency:
            task_run = await self.lease_store.claim(
                worker_id=self.worker_id,
                lease_expires_at=lease_deadline(self.lease_seconds),
            )
            if task_run is None:
                break
            claimed_any = True
            executor = self.executor_factory(self.worker_id)
            task = asyncio.create_task(executor.execute(task_run))
            self._active.add(task)
        return claimed_any

    def _collect_finished(self) -> None:
        for task in tuple(self._active):
            if not task.done():
                continue
            self._active.remove(task)
            with suppress(asyncio.CancelledError):
                error = task.exception()
                if error is not None:
                    logger.error("[FIX:274] Unhandled task executor error: %s", error)
