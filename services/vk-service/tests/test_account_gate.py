"""Tests for the in-memory AccountGate negative filter."""

import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    ACCOUNT_STATUS_COOLING_DOWN,
    ACCOUNT_STATUS_INVALID,
    SYSTEM_VK_ACCOUNT_KEY,
    ProviderAccount,
)
from app.tasks.account_gate import AccountGate


@pytest.fixture
def anyio_backend():
    return "asyncio"


def _account(*, status=ACCOUNT_STATUS_ACTIVE, cooldown_until=None) -> ProviderAccount:
    now = datetime.now(UTC)
    return ProviderAccount(
        id=uuid4(),
        account_key=SYSTEM_VK_ACCOUNT_KEY,
        provider="vk",
        status=status,
        credential_version="v1",
        capabilities=[],
        cooldown_until=cooldown_until,
        last_error_code=None,
        last_error_kind=None,
        last_validated_at=None,
        revision=1,
        created_at=now,
        updated_at=now,
    )


class RecordingSession:
    def __init__(self, account):
        self._account = account

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False


class FakeAccountsRepo:
    def __init__(self, account):
        self.account = account
        self.calls = 0

    async def get_by_key(self, account_key):
        self.calls += 1
        return self.account


class FakeSessionFactory:
    def __init__(self, repo):
        self._repo = repo

    def __call__(self):
        return RecordingSession(None)

    def repo(self):
        return self._repo


def _make_gate(account):
    repo = FakeAccountsRepo(account)
    gate = AccountGate(FakeSessionFactory(repo), lambda _session: repo)
    return gate, repo


@pytest.mark.anyio
async def test_active_account_allows_claim():
    gate, repo = _make_gate(_account())
    assert await gate.can_claim() is True
    assert repo.calls == 1


@pytest.mark.anyio
async def test_cached_invalid_short_circuits_without_db_call():
    gate, repo = _make_gate(_account(status=ACCOUNT_STATUS_INVALID))
    assert await gate.can_claim() is False
    assert repo.calls == 1
    assert await gate.can_claim() is False
    assert repo.calls == 1


@pytest.mark.anyio
async def test_cached_cooldown_short_circuits_until_expiry():
    future = datetime.now(UTC) + timedelta(hours=1)
    gate, repo = _make_gate(_account(status=ACCOUNT_STATUS_COOLING_DOWN, cooldown_until=future))
    assert await gate.can_claim() is False
    assert repo.calls == 1
    assert await gate.can_claim() is False
    assert repo.calls == 1


@pytest.mark.anyio
async def test_expired_cooldown_rechecks_db():
    repo = FakeAccountsRepo(_account(status=ACCOUNT_STATUS_COOLING_DOWN, cooldown_until=None))
    gate = AccountGate(FakeSessionFactory(repo), lambda _session: repo)

    assert await gate.can_claim() is False  # cooling_down without future cooldown
    assert repo.calls == 1


@pytest.mark.anyio
async def test_stale_active_cache_still_checks_db_and_blocks_on_invalid():
    gate, repo = _make_gate(_account())
    assert await gate.can_claim() is True
    assert repo.calls == 1

    repo.account = _account(status=ACCOUNT_STATUS_INVALID)
    assert await gate.can_claim() is False
    assert repo.calls == 2


@pytest.mark.anyio
async def test_missing_account_row_blocks_claim():
    gate, _repo = _make_gate(None)
    assert await gate.can_claim() is False


@pytest.mark.anyio
async def test_invalidate_clears_cached_block():
    gate, repo = _make_gate(_account(status=ACCOUNT_STATUS_INVALID))
    assert await gate.can_claim() is False

    repo.account = _account()
    gate.invalidate()
    assert await gate.can_claim() is True
    assert repo.calls == 2


@pytest.mark.anyio
async def test_active_with_future_cooldown_blocks():
    future = datetime.now(UTC) + timedelta(hours=1)
    gate, _repo = _make_gate(_account(status=ACCOUNT_STATUS_ACTIVE, cooldown_until=future))
    assert await gate.can_claim() is False
