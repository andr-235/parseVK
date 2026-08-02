"""Bind shared VK clients to an immutable provider credential snapshot."""

import logging
from datetime import UTC, datetime

from app.domain.entities.provider_account import SYSTEM_VK_ACCOUNT_KEY
from app.domain.exceptions.provider_account import (
    ProviderAccountBlockedError,
    ProviderCredentialChangedError,
)
from app.infrastructure.vk_client.client import (
    BoundVkApiClient,
    CredentialVersionMismatchError,
    ProviderRequestContext,
)

logger = logging.getLogger("vk-service.task-worker")


def _bind(vk_client, account_key: str, credential_version: str, lane_id: str):
    logger.debug(
        "binding vk client account=%s lane=%s credential=%s",
        account_key,
        lane_id,
        credential_version[:12],
    )
    try:
        return vk_client.bind_snapshot(
            ProviderRequestContext(
                account_id=account_key,
                credential_version=credential_version,
                lane_id=lane_id,
            )
        )
    except CredentialVersionMismatchError as error:
        raise ProviderCredentialChangedError(
            "provider credential changed after execution claim"
        ) from error


def bind_task_vk_client(vk_client, task_run) -> BoundVkApiClient:
    """Bind one execution to the provider credential captured during claim."""
    if not task_run.provider_account_key or not task_run.credential_version:
        raise ProviderAccountBlockedError(
            "task execution has no provider credential snapshot"
        )
    return _bind(
        vk_client,
        task_run.provider_account_key,
        task_run.credential_version,
        task_run.run_id,
    )


async def bind_system_vk_client(
    vk_client,
    provider_accounts_factory,
    session,
    lane_id: str,
) -> BoundVkApiClient:
    """Load and bind the executable system account for an HTTP/background lane."""
    account = await provider_accounts_factory(session).get_by_key(
        SYSTEM_VK_ACCOUNT_KEY
    )
    now = datetime.now(UTC)
    if (
        account is None
        or not account.can_execute_vk
        or (
            account.cooldown_until is not None
            and account.cooldown_until > now
        )
    ):
        raise ProviderAccountBlockedError(
            "provider account is inactive or lacks vk.all capability"
        )
    return _bind(
        vk_client,
        account.account_key,
        account.credential_version,
        lane_id,
    )
