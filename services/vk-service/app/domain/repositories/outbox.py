from abc import ABC, abstractmethod
from app.domain.models.outbox import OutboxEvent

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
    async def mark_published(self, event: OutboxEvent) -> None:
        """Mark event status to published and fill publish timestamp."""
