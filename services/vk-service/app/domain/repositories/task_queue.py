from abc import ABC, abstractmethod
from datetime import datetime

from app.domain.entities.tasks import VkTaskRun


class TaskQueueRepository(ABC):
    @abstractmethod
    async def claim_next(
        self, *, worker_id: str, lease_expires_at: datetime
    ) -> VkTaskRun | None: ...

    @abstractmethod
    async def renew_lease(
        self, *, task_id: int, run_id: str, worker_id: str, lease_expires_at: datetime
    ) -> bool: ...

    @abstractmethod
    async def mark_done(
        self,
        *,
        task_id: int,
        run_id: str,
        worker_id: str,
        processed_items: int,
        total_items: int,
    ) -> bool: ...

    @abstractmethod
    async def mark_failed(
        self, *, task_id: int, run_id: str, worker_id: str, error: str
    ) -> bool: ...

    @abstractmethod
    async def release(
        self,
        *,
        task_id: int,
        run_id: str,
        worker_id: str,
        error: str,
        available_at: datetime,
    ) -> bool: ...
