"""Provider-account guards used by the task executor: availability + invalidation."""

import logging

from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_INVALID,
    SYSTEM_VK_ACCOUNT_KEY,
)
from app.domain.exceptions.provider_account import ProviderAccountBlockedError
from app.domain.exceptions.vk_api import VkApiAuthError
from app.infrastructure.metrics.vk_metrics import set_account_status

logger = logging.getLogger("vk-service.task-worker")


async def ensure_provider_available(account_gate) -> None:
    """Raise ProviderAccountBlockedError when the provider account is not active."""
    if account_gate is not None and not await account_gate.can_claim():
        raise ProviderAccountBlockedError("provider account is not active")


async def mark_account_invalid(session_factory, provider_accounts_factory, account_gate, error: VkApiAuthError) -> None:
    """Persist the invalid transition for a dead provider account, then refresh the gate."""
    async with session_factory() as session:
        try:
            accounts = provider_accounts_factory(session)
            account = await accounts.get_by_key(SYSTEM_VK_ACCOUNT_KEY)
            if account is None:
                return
            became_invalid = await accounts.transition_to_invalid(
                account.id,
                account.credential_version,
                error_code=error.code,
                error_kind="auth",
            )
            await session.commit()
        except Exception as exc:
            logger.error("failed to record provider account invalid: %s", exc)
            await session.rollback()
            return
    logger.info(
        "provider account=%s transitioned to invalid (became_invalid=%s, code=%s)",
        SYSTEM_VK_ACCOUNT_KEY,
        became_invalid,
        error.code,
    )
    set_account_status(SYSTEM_VK_ACCOUNT_KEY, ACCOUNT_STATUS_INVALID)
    if account_gate is not None:
        account_gate.invalidate()
