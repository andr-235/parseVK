import sys
import pytest
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Insert parent and grandparent to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from app.db.base import Base
# Ensure all models are registered
from app.domain.models.vk_ingestion import VkGroup, VkAuthor, VkPost, VkComment  # noqa: F401
from app.domain.models.vk_friends import VkFriendsExportJob, VkFriendsJobLog, VkFriendsRecord  # noqa: F401
from app.domain.models.ok_friends import OkFriendsExportJob, OkFriendsJobLog, OkFriendsRecord  # noqa: F401
from app.domain.models.tasks import VkTaskRun, ProcessedEvent  # noqa: F401
from app.domain.models.outbox import OutboxEvent  # noqa: F401

# Add compiler support for JSONB on SQLite
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB

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

import json
import sqlite3
sqlite3.register_adapter(list, json.dumps)





@pytest.fixture
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="module")
async def sqlite_engine():
    # SQLite in-memory database with class NullPool or static pool
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def db_session(sqlite_engine) -> AsyncSession:
    Session = async_sessionmaker(sqlite_engine, expire_on_commit=False, class_=AsyncSession)
    async with Session() as session:
        async with session.begin():
            yield session
