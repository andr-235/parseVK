import asyncio
import json
import sqlite3
import sys
from pathlib import Path

import pytest
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

import app.db.session as session_module
from app.db.base import Base
from app.db.models import RealtimeEvent  # noqa: F401


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


sqlite3.register_adapter(list, json.dumps)

TEST_DATABASE_URL = "sqlite+aiosqlite:///test_realtime_service.db"


@pytest.fixture(scope="session")
def event_loop():
    """Create a session-scoped event loop to share across all tests."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session", autouse=True)
async def setup_test_database(anyio_backend):
    """Replace the service engine with a SQLite async engine for tests."""
    original_engine = session_module.engine
    original_session_local = session_module.SessionLocal

    test_engine = create_async_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    test_session_local = async_sessionmaker(
        test_engine, expire_on_commit=False, class_=AsyncSession
    )
    session_module.engine = test_engine
    session_module.SessionLocal = test_session_local

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()

    session_module.engine = original_engine
    session_module.SessionLocal = original_session_local

    try:
        await asyncio.to_thread(
            Path("test_realtime_service.db").unlink,
            missing_ok=True,
        )
    except OSError:
        pass


@pytest.fixture
async def db_session() -> AsyncSession:
    """Provide a fresh database session with cleaned tables."""
    async with session_module.engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())

    async with session_module.SessionLocal() as session:
        async with session.begin():
            yield session


@pytest.fixture
def fake_wire_event():
    """Factory for minimal WireEvent-like dicts."""
    from datetime import UTC, datetime
    from uuid import uuid4

    def _factory(**overrides):
        defaults = {
            "event_id": str(uuid4()),
            "event_type": "content.comments_projected",
            "event_version": 1,
            "aggregate_type": "vk_comment",
            "aggregate_id": "owner:post",
            "payload": {"insertedCount": 1, "totalCount": 1},
            "created_at": datetime.now(UTC).isoformat(),
        }
        defaults.update(overrides)
        return defaults

    return _factory


@pytest.fixture
def mock_session():
    """AsyncMock SQLAlchemy session for unit tests that do not hit the database."""
    from unittest.mock import AsyncMock

    return AsyncMock()
