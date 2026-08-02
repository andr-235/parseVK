"""Unit tests for the ProviderAccount domain entity."""

import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    ACCOUNT_STATUS_COOLING_DOWN,
    ACCOUNT_STATUS_INVALID,
    SYSTEM_VK_CAPABILITY,
    VALID_ACCOUNT_STATUSES,
    ProviderAccount,
)


def _account(
    status: str = ACCOUNT_STATUS_ACTIVE,
    cooldown_until: datetime | None = None,
    capabilities=None,
):
    return ProviderAccount(
        id=uuid4(),
        account_key="system-vk",
        provider="vk",
        status=status,
        credential_version="a" * 64,
        capabilities=(
            [SYSTEM_VK_CAPABILITY] if capabilities is None else capabilities
        ),
        cooldown_until=cooldown_until,
        last_error_code=None,
        last_error_kind=None,
        last_validated_at=datetime.now(UTC),
        revision=0,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def test_valid_statuses_are_exhaustive():
    assert VALID_ACCOUNT_STATUSES == {
        ACCOUNT_STATUS_ACTIVE,
        ACCOUNT_STATUS_INVALID,
        ACCOUNT_STATUS_COOLING_DOWN,
        "disabled",
    }


def test_is_active_only_for_active_status():
    assert _account(status=ACCOUNT_STATUS_ACTIVE).is_active is True
    assert _account(status=ACCOUNT_STATUS_INVALID).is_active is False
    assert _account(status=ACCOUNT_STATUS_COOLING_DOWN).is_active is False
    assert _account(status="disabled").is_active is False


def test_can_execute_requires_active_status_and_vk_all():
    assert _account().can_execute_vk is True
    assert _account(capabilities=[]).can_execute_vk is False
    assert _account(capabilities=["groups", "posts"]).can_execute_vk is False
    assert _account(status=ACCOUNT_STATUS_INVALID).can_execute_vk is False


def test_entity_is_frozen():
    account = _account()
    try:
        account.status = ACCOUNT_STATUS_INVALID
        assert False, "ProviderAccount must be immutable"
    except Exception:
        pass


def test_cooldown_until_roundtrip():
    until = datetime.now(UTC) + timedelta(minutes=5)
    account = _account(
        status=ACCOUNT_STATUS_COOLING_DOWN,
        cooldown_until=until,
    )
    assert account.cooldown_until == until
