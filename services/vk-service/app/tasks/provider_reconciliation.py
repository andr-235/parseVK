"""Startup reconciliation for the single system VK provider account."""

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
from app.infrastructure.vk_client.transport import VkApiConfigurationError
from app.services.vk_scheduler_models import RetryExhaustedError

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


def _result(
    status: str,
    credential_version: str,
    display_version: str,
    reason: str,
) -> ReconciliationResult:
    return ReconciliationResult(
        SYSTEM_VK_ACCOUNT_KEY,
        status,
        credential_version,
        display_version,
        reason,
    )


async def _validate_once(vk_client, credential):
    context = ProviderRequestContext(
        account_id=SYSTEM_VK_ACCOUNT_KEY,
        credential_version=credential.version_digest,
        lane_id=STARTUP_VALIDATION_LANE,
    )
    try:
        bound = vk_client.bind_credential(credential, context)
        await bound.test_token()
    except (
        VkApiAuthError,
        VkApiInfrastructureError,
        VkApiConfigurationError,
        RetryExhaustedError,
    ) as error:
        return error
    return None


def _publish_account_metrics(
    status: str,
    credential_version: str,
    cooldown_until: datetime | None,
) -> None:
    set_account_status(SYSTEM_VK_ACCOUNT_KEY, status)
    set_account_cooldown(
        SYSTEM_VK_ACCOUNT_KEY,
        cooldown_seconds_until(cooldown_until),
    )
    if credential_version:
        set_provider_account_info(SYSTEM_VK_ACCOUNT_KEY, credential_version)


async def _handle_unchanged(existing, credential, provider_accounts, current):
    if existing.status == ACCOUNT_STATUS_DISABLED:
        return _result(
            ACCOUNT_STATUS_DISABLED,
            existing.credential_version,
            credential.display_version,
            "disabled",
        )
    if existing.cooldown_until is not None and existing.cooldown_until > current:
        return _result(
            ACCOUNT_STATUS_COOLING_DOWN,
            existing.credential_version,
            credential.display_version,
            "cooldown active",
        )
    if existing.credential_version != credential.version_digest:
        return None
    if existing.status == ACCOUNT_STATUS_INVALID:
        return _result(
            ACCOUNT_STATUS_INVALID,
            existing.credential_version,
            credential.display_version,
            "already invalid",
        )
    if existing.status == ACCOUNT_STATUS_COOLING_DOWN:
        await provider_accounts.mark_active(
            existing.id,
            credential.version_digest,
            existing.capabilities or SYSTEM_VK_CAPABILITIES,
        )
        return _result(
            ACCOUNT_STATUS_ACTIVE,
            credential.version_digest,
            credential.display_version,
            "cooldown expired",
        )
    return _result(
        ACCOUNT_STATUS_ACTIVE,
        existing.credential_version,
        credential.display_version,
        "unchanged",
    )


async def reconcile_provider_account(
    vk_client,
    secret_provider,
    provider_accounts,
    *,
    now: datetime | None = None,
) -> ReconciliationResult:
    """Persist and validate the active credential without crashing the service."""
    existing = await provider_accounts.get_by_key(SYSTEM_VK_ACCOUNT_KEY)
    try:
        credential = secret_provider.load()
        if not credential.raw_secret:
            raise SecretProviderError("VK secret is empty")
    except SecretProviderError as error:
        logger.warning("startup reconciliation: VK secret unavailable: %s", error)
        if existing is not None:
            await provider_accounts.transition_to_invalid(
                existing.id,
                existing.credential_version,
                error_kind="secret_unavailable",
            )
            _publish_account_metrics(
                ACCOUNT_STATUS_INVALID,
                existing.credential_version,
                None,
            )
            return _result(
                ACCOUNT_STATUS_INVALID,
                existing.credential_version,
                "",
                "secret missing",
            )
        _publish_account_metrics(ACCOUNT_STATUS_INVALID, "", None)
        return _result(ACCOUNT_STATUS_INVALID, "", "", "secret missing")

    if existing is not None:
        outcome = await _handle_unchanged(
            existing,
            credential,
            provider_accounts,
            datetime.now(UTC) if now is None else now,
        )
        if outcome is not None:
            _publish_account_metrics(
                outcome.status,
                outcome.credential_version,
                existing.cooldown_until
                if outcome.status == ACCOUNT_STATUS_COOLING_DOWN
                else None,
            )
            return outcome

    account = await provider_accounts.upsert_system(
        account_key=SYSTEM_VK_ACCOUNT_KEY,
        provider="vk",
        credential_version=credential.version_digest,
        capabilities=SYSTEM_VK_CAPABILITIES,
    )
    failure = await _validate_once(vk_client, credential)
    if failure is not None:
        error_kind = "auth" if isinstance(failure, VkApiAuthError) else "validation"
        error_code = getattr(failure, "code", None)
        await provider_accounts.transition_to_invalid(
            account.id,
            credential.version_digest,
            error_code=error_code,
            error_kind=error_kind,
        )
        logger.warning(
            "startup reconciliation: account=%s invalid (display=%s, kind=%s)",
            SYSTEM_VK_ACCOUNT_KEY,
            credential.display_version,
            error_kind,
        )
        _publish_account_metrics(
            ACCOUNT_STATUS_INVALID,
            credential.version_digest,
            None,
        )
        reason = "auth error" if error_kind == "auth" else "validation unavailable"
        return _result(
            ACCOUNT_STATUS_INVALID,
            credential.version_digest,
            credential.display_version,
            reason,
        )

    await provider_accounts.mark_active(
        account.id,
        credential.version_digest,
        SYSTEM_VK_CAPABILITIES,
    )
    await provider_accounts.touch_validated(account.id)
    logger.info(
        "startup reconciliation: account=%s validated and active (display=%s)",
        SYSTEM_VK_ACCOUNT_KEY,
        credential.display_version,
    )
    _publish_account_metrics(
        ACCOUNT_STATUS_ACTIVE,
        credential.version_digest,
        None,
    )
    return _result(
        ACCOUNT_STATUS_ACTIVE,
        credential.version_digest,
        credential.display_version,
        "validated",
    )
