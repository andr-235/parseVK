import uuid
from abc import ABC, abstractmethod

from app.domain.entities.tasks import VkTaskRun


class TaskEventsRepository(ABC):
    @abstractmethod
    async def is_processed(self, consumer_name: str, event_id: uuid.UUID) -> bool:
        """Check if an event was already successfully processed by the consumer."""

    @abstractmethod
    async def mark_processed(self, consumer_name: str, event_id: uuid.UUID, event_type: str) -> None:
        """Mark event ID as processed to ensure idempotent consumption."""

    @abstractmethod
    async def get_task_run(self, task_id: int) -> VkTaskRun | None:
        """Fetch current VK task run session details."""

    @abstractmethod
    async def create_task_run(
        self,
        task_id: int,
        owner_user_id: str,
        run_id: str,
        scope: str,
        mode: str,
        group_ids: list[int],
        post_limit: int | None = None,
    ) -> VkTaskRun:
        """Initialize new VK task run execution tracker state."""

    @abstractmethod
    async def update_task_run(self, task_id: int, **kwargs) -> VkTaskRun | None:
        """Update task run fields by task_id and return updated entity."""

    @abstractmethod
    async def save(self) -> None:
        """Commit / flush session changes."""
