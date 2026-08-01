"""Unit tests for source models, repository ref-counting, and resolver."""

import sys
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy.dialects import postgresql

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.db.models import AccessScope, MonitoringSource, ScopeSourceAccess, TaskSource
from app.modules.sources.resolver import (
    InternalVkSourceResolver,
    SourceIdentity,
    SourceNotFoundError,
)
from app.modules.sources.scope_repository import ScopeRepository


class FakeSession:
    def __init__(self, scalar_sequence=None, get_return=None):
        self._scalar_values = list(scalar_sequence or [None])
        self.get_return = get_return
        self.added = []
        self.statements = []

    async def scalar(self, stmt):
        self.statements.append(stmt)
        return self._scalar_values.pop(0) if self._scalar_values else None

    async def get(self, model, pk):
        return self.get_return

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        return None

    async def refresh(self, obj):
        return obj


def compiled_sql(statement) -> str:
    return str(statement.compile(dialect=postgresql.dialect())).lower()


def test_monitoring_source_unique_identity():
    constraint = next(
        constraint
        for constraint in MonitoringSource.__table__.constraints
        if getattr(constraint, "name", None) == "uq_monitoring_sources_identity"
    )
    assert list(constraint.columns) == [
        MonitoringSource.__table__.c.provider,
        MonitoringSource.__table__.c.source_type,
        MonitoringSource.__table__.c.external_id,
    ]


def test_task_source_unique_pair():
    constraint = next(
        constraint
        for constraint in TaskSource.__table__.constraints
        if getattr(constraint, "name", None) == "uq_task_sources_task_source"
    )
    assert list(constraint.columns) == [
        TaskSource.__table__.c.task_id,
        TaskSource.__table__.c.source_id,
    ]


def test_scope_source_access_unique_pair():
    constraint = next(
        constraint
        for constraint in ScopeSourceAccess.__table__.constraints
        if getattr(constraint, "name", None) == "uq_scope_source_access_scope_source"
    )
    assert list(constraint.columns) == [
        ScopeSourceAccess.__table__.c.access_scope_id,
        ScopeSourceAccess.__table__.c.source_id,
    ]


def test_access_scope_has_separate_created_by_column():
    assert "created_by_user_id" in AccessScope.__table__.c
    assert "id" in AccessScope.__table__.c


@pytest.mark.asyncio
async def test_grant_scope_source_creates_row():
    scope_id, source_id = uuid4(), uuid4()
    returned = ScopeSourceAccess(
        access_scope_id=scope_id,
        source_id=source_id,
        ref_count=1,
    )
    session = FakeSession(scalar_sequence=[returned])
    repo = ScopeRepository(session)

    access = await repo.grant_scope_source(scope_id, source_id)

    sql = compiled_sql(session.statements[0])
    assert sql.startswith("insert into scope_source_access")
    assert "on conflict (access_scope_id, source_id) do update" in sql
    assert access is returned
    assert access.ref_count == 1


@pytest.mark.asyncio
async def test_grant_scope_source_increments_ref_count():
    scope_id, source_id = uuid4(), uuid4()
    returned = ScopeSourceAccess(
        access_scope_id=scope_id,
        source_id=source_id,
        ref_count=3,
    )
    session = FakeSession(scalar_sequence=[returned])
    repo = ScopeRepository(session)

    access = await repo.grant_scope_source(scope_id, source_id)

    sql = compiled_sql(session.statements[0])
    assert "ref_count = (scope_source_access.ref_count +" in sql
    assert "revoked_at =" in sql
    assert "revoked_by =" in sql
    assert access.ref_count == 3


@pytest.mark.asyncio
async def test_revoke_marks_tombstone_not_delete():
    scope_id, source_id = uuid4(), uuid4()
    existing = ScopeSourceAccess(access_scope_id=scope_id, source_id=source_id, ref_count=3)
    repo = ScopeRepository(FakeSession(scalar_sequence=[existing]))

    access = await repo.revoke_scope_source(scope_id, source_id, revoked_by="user-1")

    assert access.ref_count == 0
    assert access.revoked_at is not None
    assert access.revoked_by == "user-1"


@pytest.mark.asyncio
async def test_decrement_scope_ref_never_goes_negative():
    scope_id, source_id = uuid4(), uuid4()
    existing = ScopeSourceAccess(access_scope_id=scope_id, source_id=source_id, ref_count=0)
    repo = ScopeRepository(FakeSession(scalar_sequence=[existing]))

    await repo.decrement_scope_ref(scope_id, source_id)

    assert existing.ref_count == 0


@pytest.mark.asyncio
async def test_internal_resolver_rejects_untrusted_identity():
    resolver = InternalVkSourceResolver()

    with pytest.raises(SourceNotFoundError):
        await resolver.resolve(SourceIdentity("vk", "community", "non-numeric"))


@pytest.mark.asyncio
async def test_internal_resolver_accepts_any_positive_vk_community_id():
    resolver = InternalVkSourceResolver()

    resolved = await resolver.resolve(SourceIdentity("vk", "community", "42"))

    assert resolved.external_id == "42"
    assert resolved.owner_id == -42
    assert resolved.provider == "vk"
    assert resolved.source_type == "community"
    assert resolved.source_id
