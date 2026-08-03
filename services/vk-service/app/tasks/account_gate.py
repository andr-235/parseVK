"""In-memory negative filter for provider account state before claiming."""

import logging
from datetime import UTC, datetime

from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_COOLING_DOWN,
    ACCOUNT_STATUS_DISABLED,
    ACCOUNT_STATUS_INVALID,
    SYSTEM_VK_ACCOUNT_KEY,
    SYSTEM_VK_CAPABILITY,
)

logger = logging.getLogger("vk-service.task-worker")

_BLOCKED_STATUSES = frozenset({ACCOUNT_STATUS_INVALID, ACCOUNT_STATUS_DISABLED})


class AccountGate:
    """Cached provider-account filter consulted before every claim."""

    def __init__(
        self,
        session_factory,
        provider_accounts_factory,
        *,
        account_key: str = SYSTEM_VK_ACCOUNT_KEY,
    ):
        self._session_factory = session_factory
        self._provider_accounts_factory = provider_accounts_factory
        self._account_key = account_key
        self._status: str | None = None
        self._cooldown_until: datetime | None = None
        self._capability_ready: bool | None = None
        self._warned_blocked = False

    def invalidate(self) -> None:
        self._status = None
        self._cooldown_until = None
        self._capability_ready = None
        self._warned_blocked = False

    async def can_claim(self) -> bool:
        now = datetime.now(UTC)
        if self._status in _BLOCKED_STATUSES or self._capability_ready is False:
            self._log_blocked()
            return False
        if (
            self._status == ACCOUNT_STATUS_COOLING_DOWN
            and self._cooldown_until is not None
            and self._cooldown_until > now
        ):
            self._log_blocked()
            return False

        account = await self._load_account()
        if account is None:
            self._status = "unconfigured"
            self._cooldown_until = None
            self._capability_ready = False
            self._log_blocked()
            return False
        self._status = account.status
        self._cooldown_until = account.cooldown_until
        self._capability_ready = account.supports(SYSTEM_VK_CAPABILITY)
        if not account.is_active or not self._capability_ready:
            self._log_blocked()
            return False
        if account.cooldown_until is not None and account.cooldown_until > now:
            self._log_blocked()
            return False
        return True

    async def _load_account(self):
        async with self._session_factory() as session:
            return await self._provider_accounts_factory(session).get_by_key(
                self._account_key
            )

    def _log_blocked(self) -> None:
        if not self._warned_blocked:
            logger.warning(
                "claim blocked by account gate: account=%s status=%s capability=%s",
                self._account_key,
                self._status,
                self._capability_ready,
            )
            self._warned_blocked = True
