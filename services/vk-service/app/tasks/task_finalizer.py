import logging
from datetime import UTC, datetime, timedelta

import httpx

from app.domain.entities.tasks import VkTaskRun

logger = logging.getLogger("vk-service.task-worker")


class TaskFinalizer:
    def __init__(self, *, worker_id: str, lease_store, tasks_client):
        self.worker_id = worker_id
        self.lease_store = lease_store
        self.tasks_client = tasks_client

    async def handle_http_failure(self, task_run: VkTaskRun, exc: httpx.HTTPStatusError) -> None:
        if exc.response.status_code in {404, 409}:
            await self.lease_store.failed(
                task_id=task_run.task_id,
                run_id=task_run.run_id,
                worker_id=self.worker_id,
                error=f"tasks-service rejected execution: {exc.response.status_code}",
            )
            return
        await self.release(task_run, f"tasks-service error: {exc.response.status_code}")

    async def fail(
        self,
        task_run: VkTaskRun,
        error: str,
        *,
        retry_callback: bool = True,
    ) -> None:
        safe_error = error[:2000]
        try:
            await self.tasks_client.fail_execution(
                task_run.task_id,
                task_run.run_id,
                safe_error,
                task_run.processed_items,
                task_run.total_items,
                {},
                request_id=task_run.run_id,
                correlation_id=task_run.run_id,
            )
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code != 409:
                callback_error = f"failure callback rejected: {exc.response.status_code}"
                if retry_callback:
                    await self.release(task_run, callback_error)
                    return
                logger.error("[FIX:274] %s; marking local task terminal", callback_error)
        except httpx.RequestError as exc:
            callback_error = f"failure callback unavailable: {exc}"
            if retry_callback:
                await self.release(task_run, callback_error)
                return
            logger.error("[FIX:274] %s; marking local task terminal", callback_error)
        await self.lease_store.failed(
            task_id=task_run.task_id,
            run_id=task_run.run_id,
            worker_id=self.worker_id,
            error=safe_error,
        )

    async def release(self, task_run: VkTaskRun, error: str) -> None:
        delay = min(2**task_run.attempts, 60)
        await self.lease_store.release(
            task_id=task_run.task_id,
            run_id=task_run.run_id,
            worker_id=self.worker_id,
            error=error[:2000],
            available_at=datetime.now(UTC) + timedelta(seconds=delay),
        )
        logger.warning("[FIX:274] Released task_id=%s for retry in %ss", task_run.task_id, delay)
