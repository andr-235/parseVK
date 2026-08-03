from datetime import datetime
from typing import Protocol
from uuid import UUID

from app.domain.entities.provider_account import ProviderAccount


class ProviderAccountRepository(Protocol):
    """Port for provider account persistence."""

    async def get_by_key(self, account_key: str) -> ProviderAccount | None: ...

    async def upsert_system(
        self,
        *,
        account_key: str,
        provider: str,
        credential_version: str,
        capabilities: list[str] | None = None,
    ) -> ProviderAccount: ...

    async def transition_to_invalid(
        self, account_id: UUID, credential_version: str, *, error_code: int | None = None,
        error_kind: str | None = None,
    ) -> bool: ...

    async def set_cooldown(self, account_id: UUID, until: datetime) -> None: ...

    async def mark_active(
        self,
        account_id: UUID,
        credential_version: str,
        capabilities: list[str],
    ) -> ProviderAccount | None: ...

    async def touch_validated(self, account_id: UUID) -> None: ...
