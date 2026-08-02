"""Bind shared VK clients to an immutable provider credential snapshot."""

import logging
from datetime import UTC, datetime

from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    SYSTEM_VK_ACCOUNT_KEY,
)
from app.domain.exceptions.provider_account import ProviderAccountBlockedError
from app.infrastructure.vk_client.client import BoundVkApiClient, ProviderRequestContext

logger = logging.getLogger("vk-service.task-worker")


def _bind(vk_client, account_key: str, credential_version: str, lane_id: str):
    logger.debug(
        "binding vk client account=%s lane=%s credential=%s",
        account_key,
        lane_id,
        credential_version[:12],
    )
    return vk_client.bind_snapshot(
        ProviderRequestContext(
            account_id=account_key,
            credential_version=credential_version,
            lane_id=lane_id,
        )
    )


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
    """Load and bind the active system account for an HTTP/background lane."""
    account = await provider_accounts_factory(session).get_by_key(
        SYSTEM_VK_ACCOUNT_KEY
    )
    now = datetime.now(UTC)
    if (
        account is None
        or account.status != ACCOUNT_STATUS_ACTIVE
        or (
            account.cooldown_until is not None
            and account.cooldown_until > now
        )
    ):
        raise ProviderAccountBlockedError("provider account is not active")
    return _bind(
        vk_client,
        account.account_key,
        account.credential_version,
        lane_id,
    )
