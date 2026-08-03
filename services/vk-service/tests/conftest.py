import asyncio
import json
import os
import sqlite3
import sys
from pathlib import Path

import pytest
from sqlalchemy import BigInteger
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.compiler import compiles

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

import app.infrastructure.db.session as session_module
from app.infrastructure.db.base import Base
from app.infrastructure.db.models.executions import (  # noqa: F401
    VkExecution,
    VkExecutionAttempt,
)
from app.infrastructure.db.models.ok_friends import (  # noqa: F401
    OkFriendsExportJob,
    OkFriendsJobLog,
    OkFriendsRecord,
)
from app.infrastructure.db.models.outbox import OutboxEvent  # noqa: F401
from app.infrastructure.db.models.provider_accounts import VkProviderAccount  # noqa: F401
from app.infrastructure.db.models.source_collections import (  # noqa: F401
    VkCollectionDemand,
    VkSourceCollection,
)
from app.infrastructure.db.models.tasks import ProcessedEvent  # noqa: F401
from app.infrastructure.db.models.vk_friends import (  # noqa: F401
    VkFriendsExportJob,
    VkFriendsJobLog,
    VkFriendsRecord,
)
from app.infrastructure.db.models.vk_ingestion import (  # noqa: F401
    VkAuthor,
    VkComment,
    VkGroup,
    VkIngestionCheckpoint,
    VkPost,
)


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


@compiles(ARRAY, "sqlite")
def compile_array_sqlite(type_, compiler, **kw):
    return "TEXT"


@compiles(BigInteger, "sqlite")
def compile_bigint_sqlite(type_, compiler, **kw):
    return "INTEGER"


sqlite3.register_adapter(list, json.dumps)


@pytest.fixture(scope="session")
def event_loop():
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session", autouse=True)
async def setup_test_database():
    async with session_module.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with session_module.engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await session_module.engine.dispose()

    try:
        os.remove("test_temp.db")
    except FileNotFoundError:
        pass


@pytest.fixture
async def db_session() -> AsyncSession:
    async with session_module.engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())

    async with session_module.SessionLocal() as session:
        async with session.begin():
            yield session
