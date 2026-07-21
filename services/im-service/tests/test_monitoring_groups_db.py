import logging
import os

import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config
from app.core.config import settings
from app.db.base import Base
from app.db.models import ImGroup
from app.modules.monitoring_groups.repository import MonitoringGroupsRepository
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

TEST_DB_URL = os.environ.get("IM_SERVICE_TEST_DATABASE_URL", settings.database_url)


async def _db_responds(url: str) -> bool:
    try:
        engine = create_async_engine(url, poolclass=NullPool, connect_args={"timeout": 2})
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        await engine.dispose()
    except Exception:
        return False
    return True


@pytest_asyncio.fixture(scope="module")
async def db_engine():
    if not await _db_responds(TEST_DB_URL):
        pytest.skip("Test database is not available")

    engine = create_async_engine(TEST_DB_URL, poolclass=NullPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    async with db_engine.connect() as conn:
        trans = await conn.begin_nested()
        session_maker = async_sessionmaker(
            bind=conn, expire_on_commit=False, class_=AsyncSession
        )
        session = session_maker()
        yield session
        await session.close()
        await trans.rollback()


@pytest.mark.asyncio
async def test_create_group_with_valid_im_group_id(db_session, caplog):
    caplog.set_level(logging.WARNING)
    repo = MonitoringGroupsRepository(db_session)

    im_group = ImGroup(messenger="whatsapp", external_chat_id="chat-123", name="Source")
    db_session.add(im_group)
    await db_session.commit()

    result = await repo.create("whatsapp", "chat-1", "Group 1", im_group_id=im_group.id)
    assert result is not None
    assert result.im_group_id == im_group.id


@pytest.mark.asyncio
async def test_create_group_with_invalid_im_group_id(db_session, caplog):
    caplog.set_level(logging.WARNING)
    repo = MonitoringGroupsRepository(db_session)

    with pytest.raises(IntegrityError):
        await repo.create("whatsapp", "chat-2", "Group 2", im_group_id=999999)

    assert any(
        "FK violation: im_group_id=999999 not found in ImGroup" in record.message
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_create_group_with_duplicate_im_group_id(db_session, caplog):
    caplog.set_level(logging.WARNING)
    repo = MonitoringGroupsRepository(db_session)

    im_group = ImGroup(messenger="whatsapp", external_chat_id="chat-124", name="Source")
    db_session.add(im_group)
    await db_session.commit()

    first = await repo.create("whatsapp", "chat-3", "Group 3", im_group_id=im_group.id)
    assert first is not None

    with pytest.raises(IntegrityError):
        await repo.create("whatsapp", "chat-4", "Group 4", im_group_id=im_group.id)

    assert any(
        f"Duplicate MonitoringGroup for im_group_id={im_group.id}" in record.message
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_create_group_without_im_group_id(db_session):
    repo = MonitoringGroupsRepository(db_session)
    with pytest.raises(IntegrityError):
        await repo.create("whatsapp", "chat-5", "Group 5")


def test_migration_sql_contains_required_changes(capsys):
    """Verify the migration SQL offline without a live database."""
    cfg = Config("alembic.ini")

    command.upgrade(cfg, "20260720_0001", sql=True)
    upgrade_sql = capsys.readouterr().out.lower()

    assert "alter table monitoring_groups add column im_group_id" in upgrade_sql
    assert "foreign key" in upgrade_sql and "im_group_id" in upgrade_sql
    assert "unique" in upgrade_sql and "im_group_id" in upgrade_sql

    command.downgrade(cfg, "20260720_0001:pr5_unify_consumer_name_im", sql=True)
    downgrade_sql = capsys.readouterr().out.lower()

    assert "drop column im_group_id" in downgrade_sql


def test_not_null_migration_sql(capsys):
    """Verify the NOT NULL migration SQL offline without a live database."""
    cfg = Config("alembic.ini")

    command.upgrade(cfg, "20260720_0002", sql=True)
    upgrade_sql = capsys.readouterr().out.lower()

    assert "alter table monitoring_groups alter column im_group_id set not null" in upgrade_sql

    command.downgrade(cfg, "20260720_0002:20260720_0001", sql=True)
    downgrade_sql = capsys.readouterr().out.lower()

    assert "alter table monitoring_groups alter column im_group_id drop not null" in downgrade_sql


def test_messenger_and_category_indexes_migration_sql(capsys):
    """Verify the index migration SQL offline without a live database."""
    cfg = Config("alembic.ini")

    command.upgrade(cfg, "20260720_0003", sql=True)
    upgrade_sql = capsys.readouterr().out.lower()

    assert "create index ix_monitoring_groups_messenger" in upgrade_sql
    assert "create index ix_monitoring_groups_category" in upgrade_sql

    command.downgrade(cfg, "20260720_0003:20260720_0002", sql=True)
    downgrade_sql = capsys.readouterr().out.lower()

    assert "drop index ix_monitoring_groups_messenger" in downgrade_sql
    assert "drop index ix_monitoring_groups_category" in downgrade_sql
