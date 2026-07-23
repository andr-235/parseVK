import os

import pytest
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.db.base import Base
from app.db.models import OutboxEvent
from app.modules.outbox.repository import OutboxRepository

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
async def test_add_event_creates_uuid(db_session):
    """add_event() должна вставить строку без явного id и вернуть True."""
    repo = OutboxRepository(db_session)
    result = await repo.add_event(
        event_type="im.message_collected",
        event_version=2,
        aggregate_type="im_message",
        aggregate_id="whatsapp:chat_001:msg_001",
        dedupe_key="im.message_collected:whatsapp:chat_001:msg_001",
        payload={"messenger": "whatsapp", "messageId": "msg_001", "chatId": "chat_001"},
    )
    await db_session.commit()
    assert result is True


@pytest.mark.asyncio
async def test_add_event_generated_uuid_is_valid(db_session):
    """Проверить что id — валидный UUID."""
    repo = OutboxRepository(db_session)
    await repo.add_event(
        event_type="im.message_collected",
        event_version=2,
        aggregate_type="im_message",
        aggregate_id="whatsapp:chat_002:msg_002",
        dedupe_key="im.message_collected:whatsapp:chat_002:msg_002",
        payload={"messenger": "whatsapp", "messageId": "msg_002", "chatId": "chat_002"},
    )
    await db_session.commit()

    from uuid import UUID

    from sqlalchemy import select
    stmt = select(OutboxEvent).where(
        OutboxEvent.dedupe_key == "im.message_collected:whatsapp:chat_002:msg_002"
    )
    result = await db_session.scalar(stmt)
    assert result is not None
    assert isinstance(result.id, UUID)
    assert len(str(result.id)) == 36


@pytest.mark.asyncio
async def test_add_event_dedupe_returns_false(db_session):
    """Повторная вставка с тем же dedupe_key возвращает False."""
    repo = OutboxRepository(db_session)
    dedupe_key = "im.message_collected:whatsapp:chat_003:msg_003"

    result1 = await repo.add_event(
        event_type="im.message_collected",
        event_version=2,
        aggregate_type="im_message",
        aggregate_id="whatsapp:chat_003:msg_003",
        dedupe_key=dedupe_key,
        payload={"messenger": "whatsapp", "messageId": "msg_003", "chatId": "chat_003"},
    )
    await db_session.commit()

    result2 = await repo.add_event(
        event_type="im.message_collected",
        event_version=2,
        aggregate_type="im_message",
        aggregate_id="whatsapp:chat_003:msg_003",
        dedupe_key=dedupe_key,
        payload={"messenger": "whatsapp", "messageId": "msg_003", "chatId": "chat_003"},
    )
    await db_session.commit()

    assert result1 is True
    assert result2 is False


@pytest.mark.asyncio
async def test_add_event_dedupe_single_row(db_session):
    """Повторная вставка с тем же dedupe_key оставляет ровно одну строку."""
    repo = OutboxRepository(db_session)
    dedupe_key = "im.message_collected:whatsapp:chat_004:msg_004"

    await repo.add_event(
        event_type="im.message_collected",
        event_version=2,
        aggregate_type="im_message",
        aggregate_id="whatsapp:chat_004:msg_004",
        dedupe_key=dedupe_key,
        payload={"messenger": "whatsapp", "messageId": "msg_004", "chatId": "chat_004"},
    )
    await db_session.commit()

    await repo.add_event(
        event_type="im.message_collected",
        event_version=2,
        aggregate_type="im_message",
        aggregate_id="whatsapp:chat_004:msg_004",
        dedupe_key=dedupe_key,
        payload={"messenger": "whatsapp", "messageId": "msg_004", "chatId": "chat_004"},
    )
    await db_session.commit()

    from sqlalchemy import func, select
    result = await db_session.scalar(
        select(func.count()).where(OutboxEvent.dedupe_key == dedupe_key)
    )
    assert result == 1
