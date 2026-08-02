"""Integration tests for SqlAlchemyProviderAccountRepository over aiosqlite."""

import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from _service_path import use_service_path

use_service_path()

from app.domain.entities.provider_account import (
    ACCOUNT_STATUS_ACTIVE,
    ACCOUNT_STATUS_COOLING_DOWN,
    ACCOUNT_STATUS_INVALID,
)
from app.infrastructure.db.models.provider_accounts import VkProviderAccount
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)

VERSION_V1 = "a" * 64
VERSION_V2 = "b" * 64


async def _seed(repo: SqlAlchemyProviderAccountRepository, version: str = VERSION_V1):
    return await repo.upsert_system(
        account_key="system-vk",
        provider="vk",
        credential_version=version,
        capabilities=["groups"],
    )


@pytest.mark.anyio
async def test_transition_to_invalid_with_matching_version(db_session):
    repo = SqlAlchemyProviderAccountRepository(db_session)
    account = await _seed(repo)

    became = await repo.transition_to_invalid(
        account.id, VERSION_V1, error_code=5, error_kind="auth"
    )

    assert became is True
    loaded = await repo.get_by_key("system-vk")
    assert loaded is not None
    assert loaded.status == ACCOUNT_STATUS_INVALID
    assert loaded.last_error_code == 5
    assert loaded.last_error_kind == "auth"


@pytest.mark.anyio
async def test_second_transition_to_invalid_returns_false(db_session):
    repo = SqlAlchemyProviderAccountRepository(db_session)
    account = await _seed(repo)

    await repo.transition_to_invalid(account.id, VERSION_V1)
    second = await repo.transition_to_invalid(account.id, VERSION_V1)

    assert second is False


@pytest.mark.anyio
async def test_stale_version_guard_blocks_transition(db_session):
    repo = SqlAlchemyProviderAccountRepository(db_session)
    account = await _seed(repo, version=VERSION_V2)

    stale = await repo.transition_to_invalid(account.id, VERSION_V1)

    assert stale is False
    loaded = await repo.get_by_key("system-vk")
    assert loaded is not None
    assert loaded.status == ACCOUNT_STATUS_ACTIVE


@pytest.mark.anyio
async def test_set_cooldown_and_get_by_key_roundtrip(db_session):
    repo = SqlAlchemyProviderAccountRepository(db_session)
    account = await _seed(repo)
    until = datetime.now(UTC) + timedelta(minutes=5)

    await repo.set_cooldown(account.id, until)

    loaded = await repo.get_by_key("system-vk")
    assert loaded is not None
    assert loaded.status == ACCOUNT_STATUS_COOLING_DOWN
    assert loaded.cooldown_until is not None
    loaded_naive = loaded.cooldown_until.replace(tzinfo=UTC)
    assert (loaded_naive - until).total_seconds() < 2


@pytest.mark.anyio
async def test_mark_active_bumps_revision_and_resets_errors(db_session):
    repo = SqlAlchemyProviderAccountRepository(db_session)
    account = await _seed(repo)
    await repo.transition_to_invalid(account.id, VERSION_V1, error_code=5, error_kind="auth")

    updated = await repo.mark_active(account.id, VERSION_V1, ["groups", "posts"])

    assert updated is not None
    assert updated.status == ACCOUNT_STATUS_ACTIVE
    assert updated.revision == 1
    assert updated.capabilities == ["groups", "posts"]
    assert updated.last_error_code is None
    assert updated.last_error_kind is None
    assert updated.cooldown_until is None


@pytest.mark.anyio
async def test_upsert_system_is_idempotent(db_session):
    repo = SqlAlchemyProviderAccountRepository(db_session)
    first = await _seed(repo, version=VERSION_V1)
    second = await repo.upsert_system(
        account_key="system-vk",
        provider="vk",
        credential_version=VERSION_V2,
        capabilities=["posts"],
    )

    assert first.id == second.id
    assert second.credential_version == VERSION_V2
    assert second.capabilities == ["posts"]

    count = await db_session.scalar(
        select(func.count()).select_from(VkProviderAccount)
    )
    assert count == 1
