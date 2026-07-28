import asyncio
import logging
from datetime import UTC, datetime, timedelta

import httpx

from app.domain.entities.tasks import VkTaskRun
from app.services.ingestion.pipeline import IngestionFailedError
from app.tasks.task_finalizer import TaskFinalizer

logger = logging.getLogger("vk-service.task-worker")


class LeaseLostError(RuntimeError):
    pass


class TaskExecutor:
    def __init__(
        self,
        *,
        worker_id: str,
        lease_store,
        session_factory,
        ingestion_factory,
        tasks_client,
        lease_seconds: int,
        heartbeat_seconds: int,
        timeout_seconds: int,
        max_attempts: int,
    ):
        self.worker_id = worker_id
        self.lease_store = lease_store
        self.session_factory = session_factory
        self.ingestion_factory = ingestion_factory
        self.tasks_client = tasks_client
        self.lease_seconds = lease_seconds
        self.heartbeat_seconds = heartbeat_seconds
        self.timeout_seconds = timeout_seconds
        self.max_attempts = max_attempts
        self.finalizer = TaskFinalizer(
            worker_id=worker_id, lease_store=lease_store, tasks_client=tasks_client
        )

    async def execute(self, task_run: VkTaskRun) -> None:
        logger.info(
            "Claimed VK task task_id=%s run_id=%s attempt=%s worker=%s",
            task_run.task_id,
            task_run.run_id,
            task_run.attempts,
            self.worker_id,
        )
        if task_run.attempts > self.max_attempts:
            await self.finalizer.fail(task_run, "Task lease recovery attempts exhausted")
            return
        try:
            remote = await self.tasks_client.start_execution(
                task_run.task_id,
                task_run.run_id,
                request_id=task_run.run_id,
                correlation_id=task_run.run_id,
            )
            if remote.get("status") == "done":
                await self._mark_done(
                    task_run,
                    processed_items=remote.get("processedItems", 0),
                    total_items=remote.get("totalItems", 0),
                    stats=remote.get("stats") or {},
                )
                return
            result = await self._run_guarded(task_run)
            await self._mark_done(
                task_run,
                processed_items=result.processed_items,
                total_items=result.processed_items,
                stats=result.stats(),
            )
            logger.info("Completed VK task task_id=%s", task_run.task_id)
        except LeaseLostError:
            logger.warning(
                "Lease lost for task_id=%s; execution cancelled", task_run.task_id
            )
        except IngestionFailedError as exc:
            await self.finalizer.fail(
                task_run,
                exc.error,
                processed_items=exc.result.processed_items,
                total_items=exc.result.processed_items,
                stats=exc.result.stats(),
            )
        except TimeoutError:
            await self.finalizer.fail(
                task_run,
                f"Task timed out after {self.timeout_seconds}s",
                processed_items=task_run.processed_items,
                total_items=task_run.total_items,
            )
        except httpx.RequestError as exc:
            await self.finalizer.release(task_run, f"tasks-service unavailable: {exc}")
        except httpx.HTTPStatusError as exc:
            await self.finalizer.handle_http_failure(task_run, exc)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            await self.finalizer.fail(task_run, str(exc) or type(exc).__name__)

    async def _mark_done(
        self,
        task_run: VkTaskRun,
        *,
        processed_items: int,
        total_items: int,
        stats: dict,
    ) -> None:
        try:
            await self.lease_store.done(
                task_id=task_run.task_id,
                run_id=task_run.run_id,
                worker_id=self.worker_id,
                processed_items=processed_items,
                total_items=total_items,
                stats=stats,
            )
        except Exception as exc:
            logger.warning(
                "Failed to mark task_id=%s as done: %s. Releasing lease for retry.",
                task_run.task_id,
                exc,
            )
            await self.finalizer.release(
                task_run,
                f"completion recording failed: {exc}",
            )

    async def _run_guarded(self, task_run: VkTaskRun):
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

    async def _run_ingestion(self, task_run: VkTaskRun):
        async with self.session_factory() as session:
            service = self.ingestion_factory(session)
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

    async def _heartbeat(self, task_run: VkTaskRun) -> None:
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
