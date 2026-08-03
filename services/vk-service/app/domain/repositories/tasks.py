import uuid
from abc import ABC, abstractmethod


class TaskEventsRepository(ABC):
    """Inbox/idempotency storage for task lifecycle events.

    Physical executions and per-TaskRun lifecycle are owned by the source
    collection repository. This interface deliberately cannot create, reopen,
    cancel or fail a VkExecution directly.
    """

    @abstractmethod
    async def is_processed(self, consumer_name: str, event_id: uuid.UUID) -> bool: ...

    @abstractmethod
    async def mark_processed(
        self, consumer_name: str, event_id: uuid.UUID, event_type: str
    ) -> None: ...
