"""Provider-account guards used by the task executor."""

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
    """Raise when the provider account cannot accept new work."""
    if account_gate is not None and not await account_gate.can_claim():
        raise ProviderAccountBlockedError("provider account is not active")


async def block_account_version(
    session_factory,
    provider_accounts_factory,
    account_gate,
    *,
    credential_version: str,
    error_code: int | None,
    error_kind: str,
) -> bool:
    """Invalidate one credential version without touching a rotated successor."""
    became_invalid = False
    async with session_factory() as session:
        try:
            accounts = provider_accounts_factory(session)
            account = await accounts.get_by_key(SYSTEM_VK_ACCOUNT_KEY)
            if account is None:
                return False
            became_invalid = await accounts.transition_to_invalid(
                account.id,
                credential_version,
                error_code=error_code,
                error_kind=error_kind,
            )
            await session.commit()
        except Exception as exc:
            logger.error("failed to block provider account version: %s", exc)
            await session.rollback()
            return False

    logger.info(
        "provider account=%s invalid transition=%s credential=%s kind=%s code=%s",
        SYSTEM_VK_ACCOUNT_KEY,
        became_invalid,
        credential_version[:12],
        error_kind,
        error_code,
    )
    if became_invalid:
        set_account_status(SYSTEM_VK_ACCOUNT_KEY, ACCOUNT_STATUS_INVALID)
        if account_gate is not None:
            account_gate.invalidate()
    return became_invalid


async def mark_account_invalid(
    session_factory,
    provider_accounts_factory,
    account_gate,
    error: VkApiAuthError,
    *,
    credential_version: str,
) -> bool:
    """Block the exact credential version that produced an auth error."""
    return await block_account_version(
        session_factory,
        provider_accounts_factory,
        account_gate,
        credential_version=credential_version,
        error_code=error.code,
        error_kind="auth",
    )
