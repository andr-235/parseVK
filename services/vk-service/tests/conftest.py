import asyncio
import json
import sqlite3
import sys
from pathlib import Path

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

# Import session module with a name that doesn't conflict with the db_session fixture
import app.infrastructure.db.session as session_module
from app.db.base import Base
from app.domain.models.ok_friends import (  # noqa: F401
    OkFriendsExportJob,
    OkFriendsJobLog,
    OkFriendsRecord,
)
from app.domain.models.outbox import OutboxEvent  # noqa: F401
from app.domain.models.tasks import ProcessedEvent, VkTaskRun  # noqa: F401
from app.domain.models.vk_friends import (  # noqa: F401
    VkFriendsExportJob,
    VkFriendsJobLog,
    VkFriendsRecord,
)

# Ensure all models are registered
from app.domain.models.vk_ingestion import VkAuthor, VkComment, VkGroup, VkPost  # noqa: F401
from sqlalchemy.dialects.postgresql import JSONB

# Add compiler support for JSONB on SQLite
from sqlalchemy.ext.compiler import compiles


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"

from sqlalchemy.dialects.postgresql import ARRAY


@compiles(ARRAY, "sqlite")
def compile_array_sqlite(type_, compiler, **kw):
    return "TEXT"

from sqlalchemy import BigInteger


@compiles(BigInteger, "sqlite")
def compile_bigint_sqlite(type_, compiler, **kw):
    return "INTEGER"

sqlite3.register_adapter(list, json.dumps)


@pytest.fixture(scope="session")
def event_loop():
    """Create a session-scoped event loop to share across all tests."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session", autouse=True)
async def setup_test_database():
    # Create all tables on the shared test engine
    async with session_module.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    yield
    
    async with session_module.engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await session_module.engine.dispose()

    # Clean up the test database file
    db_file = Path("test_temp.db")
    if db_file.exists():
        try:
            db_file.unlink()
        except Exception:
            pass


@pytest.fixture
async def db_session() -> AsyncSession:
    # Clear all tables to ensure test isolation
    async with session_module.engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())

    # Yield database sessions from the shared SessionLocal
    async with session_module.SessionLocal() as session:
        async with session.begin():
            yield session
