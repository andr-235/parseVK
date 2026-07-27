from __future__ import annotations

from typing import Protocol
from uuid import UUID

from common.outbox.models import OutboxMessage


class OutboxRepository(Protocol):
    async def claim_batch(self, limit: int = 100) -> list[OutboxMessage]: ...

    async def mark_published(self, event_id: UUID) -> None: ...

    async def mark_failed(self, event_id: UUID, error: str) -> bool: ...
