from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

SYSTEM_VK_ACCOUNT_KEY = "system-vk"

ACCOUNT_STATUS_ACTIVE = "active"
ACCOUNT_STATUS_INVALID = "invalid"
ACCOUNT_STATUS_COOLING_DOWN = "cooling_down"
ACCOUNT_STATUS_DISABLED = "disabled"

VALID_ACCOUNT_STATUSES = frozenset(
    {ACCOUNT_STATUS_ACTIVE, ACCOUNT_STATUS_INVALID, ACCOUNT_STATUS_COOLING_DOWN, ACCOUNT_STATUS_DISABLED}
)


@dataclass(frozen=True)
class ProviderAccount:
    id: UUID
    account_key: str
    provider: str
    status: str
    credential_version: str
    capabilities: list[str]
    cooldown_until: datetime | None
    last_error_code: int | None
    last_error_kind: str | None
    last_validated_at: datetime | None
    revision: int
    created_at: datetime
    updated_at: datetime

    @property
    def is_active(self) -> bool:
        return self.status == ACCOUNT_STATUS_ACTIVE
