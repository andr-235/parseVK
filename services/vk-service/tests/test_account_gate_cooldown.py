from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    ACCOUNT_STATUS_COOLING_DOWN,
    SYSTEM_VK_ACCOUNT_KEY,
    SYSTEM_VK_CAPABILITY,
    ProviderAccount,
)
from app.tasks.account_gate import AccountGate


def _account(status, cooldown_until=None):
    now = datetime.now(UTC)
    return ProviderAccount(
        id=uuid4(),
        account_key=SYSTEM_VK_ACCOUNT_KEY,
        provider="vk",
        status=status,
        credential_version="a" * 64,
        capabilities=[SYSTEM_VK_CAPABILITY],
        cooldown_until=cooldown_until,
        last_error_code=None,
        last_error_kind=None,
        last_validated_at=now,
        revision=1,
        created_at=now,
        updated_at=now,
    )


class Session:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None


class Accounts:
    def __init__(self, account):
        self.account = account
        self.calls = 0

    async def get_by_key(self, _account_key):
        self.calls += 1
        return self.account


@pytest.mark.anyio
async def test_gate_rechecks_database_after_cached_cooldown_expires():
    accounts = Accounts(
        _account(
            ACCOUNT_STATUS_COOLING_DOWN,
            datetime.now(UTC) + timedelta(hours=1),
        )
    )
    gate = AccountGate(lambda: Session(), lambda _session: accounts)

    assert await gate.can_claim() is False
    assert accounts.calls == 1

    gate._cooldown_until = datetime.now(UTC) - timedelta(seconds=1)
    accounts.account = _account(ACCOUNT_STATUS_ACTIVE)

    assert await gate.can_claim() is True
    assert accounts.calls == 2
