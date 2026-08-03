"""Supervises a single ingestion run: heartbeat renewal, timeout and cancellation."""

import asyncio
import inspect
import logging
from datetime import UTC, datetime, timedelta

logger = logging.getLogger("vk-service.task-worker")


class LeaseLostError(RuntimeError):
    pass


class TaskRunRunner:
    """Runs one ingestion with a heartbeat lease and a hard timeout."""

    def __init__(
        self,
        *,
        lease_store,
        session_factory,
        ingestion_factory,
        worker_id: str,
        lease_seconds: int,
        heartbeat_seconds: int,
        timeout_seconds: int,
        adapter_factory=None,
    ):
        self.lease_store = lease_store
        self.session_factory = session_factory
        self.ingestion_factory = ingestion_factory
        self.worker_id = worker_id
        self.lease_seconds = lease_seconds
        self.heartbeat_seconds = heartbeat_seconds
        self.timeout_seconds = timeout_seconds
        self.adapter_factory = adapter_factory

    async def run(self, task_run) -> object:
        ingestion_task = asyncio.create_task(self._run_ingestion(task_run))
        heartbeat_task = asyncio.create_task(self._heartbeat(task_run))
        try:
            async with asyncio.timeout(self.timeout_seconds):
                done, _ = await asyncio.wait(
                    {ingestion_task, heartbeat_task}, return_when=asyncio.FIRST_COMPLETED
                )
                if heartbeat_task in done:
                    await heartbeat_task
                return await ingestion_task
        finally:
            for task in (ingestion_task, heartbeat_task):
                if not task.done():
                    task.cancel()
            await asyncio.gather(ingestion_task, heartbeat_task, return_exceptions=True)

    async def _run_ingestion(self, task_run):
        async with self.session_factory() as session:
            adapter = None
            if self.adapter_factory is not None:
                adapter = self.adapter_factory(session, task_run)
                if inspect.isawaitable(adapter):
                    adapter = await adapter
            service = self.ingestion_factory(session, adapter=adapter)
            try:
                result = await service.execute(task_run, correlation_id=task_run.run_id)
                await session.commit()
                return result
            except asyncio.CancelledError:
                await session.rollback()
                raise
            except Exception:
                await session.rollback()
                raise

    async def _heartbeat(self, task_run) -> None:
        while True:
            await asyncio.sleep(self.heartbeat_seconds)
            renewed = await self.lease_store.renew(
                task_id=task_run.task_id,
                run_id=task_run.run_id,
                worker_id=self.worker_id,
                lease_expires_at=datetime.now(UTC) + timedelta(seconds=self.lease_seconds),
            )
            if not renewed:
                raise LeaseLostError(f"Lease lost for task {task_run.task_id}")
