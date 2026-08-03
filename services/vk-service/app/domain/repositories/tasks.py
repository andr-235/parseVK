import uuid
from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.executions import VkExecution


class TaskEventsRepository(ABC):
    @abstractmethod
    async def is_processed(self, consumer_name: str, event_id: uuid.UUID) -> bool: ...

    @abstractmethod
    async def mark_processed(
        self, consumer_name: str, event_id: uuid.UUID, event_type: str
    ) -> None: ...

    @abstractmethod
    async def get_execution(self, task_id: int, run_id: str) -> VkExecution | None: ...

    @abstractmethod
    async def get_active_execution(self, task_id: int) -> VkExecution | None: ...

    @abstractmethod
    async def get_latest_execution(self, task_id: int) -> VkExecution | None: ...

    @abstractmethod
    async def create_execution(
        self,
        *,
        task_id: int,
        owner_user_id: str,
        run_id: str,
        scope: str,
        mode: str,
        group_ids: list[int],
        post_limit: int | None,
        plan_snapshot: dict,
        parent_execution_id: UUID | None,
    ) -> VkExecution: ...

    @abstractmethod
    async def request_cancellation(
        self, *, task_id: int, run_id: str | None, reason: str
    ) -> VkExecution | None: ...

    @abstractmethod
    async def fail_pending(self, execution_id: UUID, error: str) -> bool: ...
