"""Startup reconciliation: validate the VK credential once and seed the account row."""

import logging
from dataclasses import dataclass
from datetime import UTC, datetime

from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    ACCOUNT_STATUS_COOLING_DOWN,
    ACCOUNT_STATUS_DISABLED,
    ACCOUNT_STATUS_INVALID,
    SYSTEM_VK_ACCOUNT_KEY,
)
from app.domain.exceptions.vk_api import VkApiAuthError, VkApiInfrastructureError
from app.domain.ports.secret_provider import SecretProviderError
from app.infrastructure.metrics.vk_metrics import (
    cooldown_seconds_until,
    set_account_cooldown,
    set_account_status,
    set_provider_account_info,
)
from app.infrastructure.vk_client.base import ProviderRequestContext

logger = logging.getLogger(__name__)

STARTUP_VALIDATION_LANE = "system:startup-validation"
SYSTEM_VK_CAPABILITIES = ["vk.all"]


@dataclass(frozen=True)
class ReconciliationResult:
    account_key: str
    status: str
    credential_version: str
    display_version: str
    reason: str


def _result(status: str, credential_version: str, display_version: str, reason: str) -> ReconciliationResult:
    return ReconciliationResult(SYSTEM_VK_ACCOUNT_KEY, status, credential_version, display_version, reason)


async def _validate_once(vk_client, credential) -> VkApiAuthError | VkApiInfrastructureError | None:
    bound = vk_client.bind(
        ProviderRequestContext(
            account_id=SYSTEM_VK_ACCOUNT_KEY,
            credential_version=credential.version_digest,
            lane_id=STARTUP_VALIDATION_LANE,
        )
    )
    try:
        await bound.test_token()
    except (VkApiAuthError, VkApiInfrastructureError) as error:
        return error
    return None


def _publish_account_metrics(status: str, credential_version: str, cooldown_until: datetime | None) -> None:
    set_account_status(SYSTEM_VK_ACCOUNT_KEY, status)
    set_account_cooldown(SYSTEM_VK_ACCOUNT_KEY, cooldown_seconds_until(cooldown_until))
    if credential_version:
        set_provider_account_info(SYSTEM_VK_ACCOUNT_KEY, credential_version)


async def _check_existing(existing, credential, current: datetime) -> ReconciliationResult | None:
    if existing.cooldown_until is not None and existing.cooldown_until > current:
        logger.info("startup reconciliation: account=%s stays cooling_down until %s (display=%s)",
                    SYSTEM_VK_ACCOUNT_KEY, existing.cooldown_until, credential.display_version)
        return _result(ACCOUNT_STATUS_COOLING_DOWN, existing.credential_version,
                       credential.display_version, "cooldown active")
    if existing.status == ACCOUNT_STATUS_DISABLED:
        logger.info("startup reconciliation: account=%s is disabled, stays disabled (display=%s)",
                    SYSTEM_VK_ACCOUNT_KEY, credential.display_version)
        return _result(ACCOUNT_STATUS_DISABLED, existing.credential_version,
                       credential.display_version, "disabled")
    if existing.credential_version == credential.version_digest:
        if existing.status == ACCOUNT_STATUS_INVALID:
            logger.warning("startup reconciliation: account=%s already invalid (display=%s), "
                           "stays invalid; operator action required",
                           SYSTEM_VK_ACCOUNT_KEY, credential.display_version)
            return _result(ACCOUNT_STATUS_INVALID, existing.credential_version,
                           credential.display_version, "already invalid")
        logger.debug("startup reconciliation: account=%s unchanged and active, validation skipped", SYSTEM_VK_ACCOUNT_KEY)
        return _result(ACCOUNT_STATUS_ACTIVE, existing.credential_version,
                       credential.display_version, "unchanged")
    return None


async def reconcile_provider_account(
    vk_client,
    secret_provider,
    provider_accounts,
    *,
    now: datetime | None = None,
) -> ReconciliationResult:
    """Upsert the system-vk row and validate the credential once.

    Never raises: configuration or validation failures are recorded in the
    result so the container stays up and the worker gate stays closed.
    """
    try:
        credential = secret_provider.load()
    except SecretProviderError as error:
        logger.warning("startup reconciliation: VK secret unavailable: %s", error)
        return _result(ACCOUNT_STATUS_INVALID, "", "", "secret missing")

    if not credential.raw_secret:
        logger.warning("startup reconciliation: VK secret is empty, account stays unconfigured")
        return _result(ACCOUNT_STATUS_INVALID, "", "", "secret missing")

    existing = await provider_accounts.get_by_key(SYSTEM_VK_ACCOUNT_KEY)
    if existing is not None:
        outcome = await _check_existing(existing, credential, datetime.now(UTC) if now is None else now)
        if outcome is not None:
            _publish_account_metrics(existing.status, existing.credential_version, existing.cooldown_until)
            return outcome

    account = await provider_accounts.upsert_system(
        account_key=SYSTEM_VK_ACCOUNT_KEY,
        provider="vk",
        credential_version=credential.version_digest,
        capabilities=SYSTEM_VK_CAPABILITIES,
    )
    failure = await _validate_once(vk_client, credential)
    if isinstance(failure, VkApiAuthError):
        became_invalid = await provider_accounts.transition_to_invalid(
            account.id,
            credential.version_digest,
            error_code=failure.code,
            error_kind="auth",
        )
        logger.warning("startup reconciliation: account=%s invalidated (became_invalid=%s, display=%s, reason=%s)",
                       SYSTEM_VK_ACCOUNT_KEY, became_invalid, credential.display_version, failure)
        _publish_account_metrics(ACCOUNT_STATUS_INVALID, credential.version_digest, None)
        return _result(ACCOUNT_STATUS_INVALID, credential.version_digest, credential.display_version, "auth error")
    if failure is not None:
        logger.warning("startup reconciliation: validation could not complete for account=%s (display=%s): %s",
                       SYSTEM_VK_ACCOUNT_KEY, credential.display_version, failure)
        _publish_account_metrics(ACCOUNT_STATUS_ACTIVE, credential.version_digest, None)
        return _result(ACCOUNT_STATUS_ACTIVE, credential.version_digest, credential.display_version, "validation not completed")

    await provider_accounts.mark_active(account.id, credential.version_digest, SYSTEM_VK_CAPABILITIES)
    await provider_accounts.touch_validated(account.id)
    logger.info("startup reconciliation: account=%s validated and active (display=%s)",
                SYSTEM_VK_ACCOUNT_KEY, credential.display_version)
    _publish_account_metrics(ACCOUNT_STATUS_ACTIVE, credential.version_digest, None)
    return _result(ACCOUNT_STATUS_ACTIVE, credential.version_digest, credential.display_version, "validated")
