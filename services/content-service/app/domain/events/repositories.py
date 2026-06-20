from typing import Protocol
from uuid import UUID


class ProcessedEventRepository(Protocol):
    async def is_processed(self, consumer_name: str, event_id: UUID) -> bool: ...
    async def mark_processed(
        self,
        consumer_name: str,
        event_id: UUID,
        event_type: str,
    ) -> None: ...
