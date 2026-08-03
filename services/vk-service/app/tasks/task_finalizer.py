import logging
from datetime import UTC, datetime, timedelta

from app.domain.entities.tasks import VkTaskRun

logger = logging.getLogger("vk-service.task-worker")


class TaskFinalizer:
    def __init__(self, *, worker_id: str, lease_store):
        self.worker_id = worker_id
        self.lease_store = lease_store

    async def fail(
        self,
        task_run: VkTaskRun,
        error: str,
        *,
        processed_items: int = 0,
        total_items: int = 0,
        stats: dict | None = None,
    ) -> None:
        safe_error = error[:2000]
        recorded = await self.lease_store.failed(
            task_id=task_run.task_id,
            run_id=task_run.run_id,
            worker_id=self.worker_id,
            error=safe_error,
            processed_items=processed_items,
            total_items=total_items,
            stats=stats or {},
        )
        if not recorded:
            logger.warning(
                "Failed to record terminal failure for task_id=%s; lease ownership was lost",
                task_run.task_id,
            )

    async def release(self, task_run: VkTaskRun, error: str) -> None:
        delay = min(2 ** min(task_run.attempts, 6), 60)
        await self.lease_store.release(
            task_id=task_run.task_id,
            run_id=task_run.run_id,
            worker_id=self.worker_id,
            error=error[:2000],
            available_at=datetime.now(UTC) + timedelta(seconds=delay),
        )
        logger.warning("Released task_id=%s for retry in %ss", task_run.task_id, delay)

    async def release_blocked(self, task_run: VkTaskRun, reason: str) -> None:
        """Release to pending with no retry backoff (provider-blocked path)."""
        await self.lease_store.release(
            task_id=task_run.task_id,
            run_id=task_run.run_id,
            worker_id=self.worker_id,
            error=reason[:2000],
            available_at=datetime.now(UTC),
        )
        logger.warning(
            "Released task_id=%s without retry backoff (reason=%s)",
            task_run.task_id,
            reason,
        )
