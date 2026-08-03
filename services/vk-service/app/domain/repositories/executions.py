from abc import ABC, abstractmethod
from datetime import datetime
from uuid import UUID

from app.domain.entities.executions import VkExecutionClaim


class ExecutionRepository(ABC):
    @abstractmethod
    async def claim_next(
        self,
        *,
        worker_id: str,
        lease_expires_at: datetime,
        account_key: str = "system-vk",
    ) -> VkExecutionClaim | None: ...

    @abstractmethod
    async def renew(
        self,
        *,
        execution_id: UUID,
        attempt_id: UUID,
        fencing_token: int,
        lease_expires_at: datetime,
    ) -> bool: ...

    @abstractmethod
    async def complete(
        self,
        *,
        execution_id: UUID,
        attempt_id: UUID,
        fencing_token: int,
        processed_items: int,
        total_items: int,
        stats: dict | None = None,
    ) -> bool: ...

    @abstractmethod
    async def fail(
        self,
        *,
        execution_id: UUID,
        attempt_id: UUID,
        fencing_token: int,
        error: str,
        processed_items: int = 0,
        total_items: int = 0,
        stats: dict | None = None,
    ) -> bool: ...

    @abstractmethod
    async def cancel(
        self,
        *,
        execution_id: UUID,
        attempt_id: UUID,
        fencing_token: int,
    ) -> bool: ...

    @abstractmethod
    async def release(
        self,
        *,
        execution_id: UUID,
        attempt_id: UUID,
        fencing_token: int,
        error: str,
        available_at: datetime,
    ) -> bool: ...
