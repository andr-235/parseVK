from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.outbox import OutboxEvent


class OutboxRepository(ABC):
    @abstractmethod
    async def add_event(
        self,
        *,
        event_type: str,
        aggregate_type: str,
        aggregate_id: str,
        payload: dict,
        correlation_id: str | None = None,
        dedupe_key: str | None = None,
    ) -> None:
        """Append a new domain event to transaction outbox queue table."""

    @abstractmethod
    async def list_pending(self, *, limit: int = 100) -> list[OutboxEvent]:
        """Fetch list of pending events that are due to publish."""

    @abstractmethod
    async def lock_pending_batch(self, limit: int = 100) -> list[OutboxEvent]:
        """FOR UPDATE SKIP LOCKED batch of pending events."""

    @abstractmethod
    async def mark_published(self, event_id: UUID) -> None:
        """Mark event status to published and fill publish timestamp."""

    @abstractmethod
    async def mark_failed_or_retry(self, event_id: UUID, error: str) -> bool:
        """Increment attempts; retry with backoff or mark as failed. Returns True if permanently failed."""
