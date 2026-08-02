"""CLI logic for candidate validation and provider account status."""

import logging
from datetime import UTC, datetime

from app.core.config import settings
from app.core.redaction import redact_secrets
from app.domain.entities.credentials import CredentialMaterial
from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    SYSTEM_VK_ACCOUNT_KEY,
    SYSTEM_VK_CAPABILITY,
)
from app.domain.exceptions.vk_api import VkApiAuthError
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)
from app.infrastructure.vk_client.client import BoundVkApiClient, ProviderRequestContext
from app.infrastructure.vk_client.transport import VkTransport
from app.services.vk_retry_policy import VkRetryPolicy
from app.services.vk_scheduler import FairScheduler

logger = logging.getLogger("validate_token")

EXIT_OK = 0
EXIT_AUTH_FAILURE = 1
EXIT_INFRA_CONFIG = 2

VALIDATION_LANE = "cli:validate-token"
CAPABILITIES = [SYSTEM_VK_CAPABILITY]

__all__ = ["exit_code_for", "read_account_status", "validate_candidate"]


def _payload(
    *,
    display_version: str | None,
    status: str,
    capabilities: list[str],
    validated_at: str | None,
    ok: bool,
    errors: list[str],
) -> dict:
    return {
        "account_key": SYSTEM_VK_ACCOUNT_KEY,
        "display_version": display_version,
        "status": status,
        "capabilities": capabilities,
        "validated_at": validated_at,
        "ok": ok,
        "errors": errors,
    }


def _failure(display_version: str | None, exc: Exception) -> dict:
    return _payload(
        display_version=display_version,
        status="unknown",
        capabilities=[],
        validated_at=None,
        ok=False,
        errors=[redact_secrets(str(exc))],
    )


def exit_code_for(payload: dict) -> int:
    if payload["ok"]:
        return EXIT_OK
    if payload["status"] == "invalid":
        return EXIT_AUTH_FAILURE
    return EXIT_INFRA_CONFIG


async def validate_candidate(
    credential: CredentialMaterial,
    *,
    transport: VkTransport | None = None,
    scheduler: FairScheduler | None = None,
) -> dict:
    """Probe users.get with the candidate credential via a local scheduler."""
    transport = transport or VkTransport()
    scheduler = scheduler or FairScheduler(VkRetryPolicy(settings))
    context = ProviderRequestContext(
        account_id=SYSTEM_VK_ACCOUNT_KEY,
        credential_version=credential.version_digest,
        lane_id=VALIDATION_LANE,
    )
    bound = BoundVkApiClient(
        scheduler=scheduler,
        transport=transport,
        credential=credential,
        context=context,
    )
    validated_at = datetime.now(UTC).isoformat()
    try:
        await bound.test_token()
    except VkApiAuthError as exc:
        return _payload(
            display_version=credential.display_version,
            status="invalid",
            capabilities=CAPABILITIES,
            validated_at=validated_at,
            ok=False,
            errors=[redact_secrets(str(exc))],
        )
    except Exception as exc:  # noqa: BLE001 - infra/config errors map to exit 2
        return _failure(credential.display_version, exc)
    return _payload(
        display_version=credential.display_version,
        status=ACCOUNT_STATUS_ACTIVE,
        capabilities=CAPABILITIES,
        validated_at=validated_at,
        ok=True,
        errors=[],
    )


async def read_account_status(session, accounts_factory=None) -> dict:
    accounts = accounts_factory or SqlAlchemyProviderAccountRepository
    account = await accounts(session).get_by_key(SYSTEM_VK_ACCOUNT_KEY)
    if account is None:
        return _payload(
            display_version=None,
            status="unconfigured",
            capabilities=[],
            validated_at=None,
            ok=False,
            errors=["provider account is not configured"],
        )
    errors = [] if account.can_execute_vk else [
        "provider account is inactive or lacks vk.all capability"
    ]
    return _payload(
        display_version=account.credential_version[:12],
        status=account.status,
        capabilities=account.capabilities,
        validated_at=(
            account.last_validated_at.isoformat()
            if account.last_validated_at is not None
            else None
        ),
        ok=account.can_execute_vk,
        errors=errors,
    )
