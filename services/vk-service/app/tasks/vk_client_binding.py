"""Bind VK clients to the immutable credential snapshot of one attempt."""

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

logger = logging.getLogger("vk-service.execution-worker")


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


def bind_execution_vk_client(vk_client, claim) -> BoundVkApiClient:
    if not claim.provider_account_key or not claim.credential_version:
        raise ProviderAccountBlockedError(
            "execution attempt has no provider credential snapshot"
        )
    return _bind(
        vk_client,
        claim.provider_account_key,
        claim.credential_version,
        str(claim.execution_id),
    )


async def bind_system_vk_client(
    vk_client,
    provider_accounts_factory,
    session,
    lane_id: str,
) -> BoundVkApiClient:
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
            "provider account is not active or lacks vk.all capability"
        )
    return _bind(
        vk_client,
        account.account_key,
        account.credential_version,
        lane_id,
    )
