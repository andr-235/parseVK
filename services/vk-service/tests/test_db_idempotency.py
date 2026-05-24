import sys
from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import BigInteger

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(element, compiler, **kw):
    return "TEXT"

@compiles(BigInteger, "sqlite")
def compile_bigint_sqlite(element, compiler, **kw):
    return "INTEGER"

from app.db.base import Base
from app.db.models import VkAuthor, VkComment, VkGroup, VkPost
from app.modules.ingestion.repository import IngestionRepository


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_db_idempotency_upserts():
    # Setup asynchronous sqlite database in-memory
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    
    # Create only the 4 tested tables manually
    async with engine.begin() as conn:
        await conn.run_sync(VkGroup.__table__.create)
        await conn.run_sync(VkAuthor.__table__.create)
        await conn.run_sync(VkPost.__table__.create)
        await conn.run_sync(VkComment.__table__.create)
        
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        async with session.begin():
            repository = IngestionRepository(session)
            
            # --- 1. Test VkGroup Idempotency ---
            group_payload = {
                "id": 100,
                "screen_name": "group_100",
                "name": "Group 100",
                "is_closed": 0,
            }
            # First upsert
            await repository.upsert_group(group_payload)
            # Second upsert (duplicate) with updated name
            updated_group_payload = group_payload.copy()
            updated_group_payload["name"] = "Group 100 Updated"
            await repository.upsert_group(updated_group_payload)
            
            # --- 2. Test VkAuthor Idempotency ---
            author_payload = {
                "vk_author_id": 500,
                "type": "user",
                "display_name": "Author 500",
                "raw": {},
            }
            # First upsert
            await repository.upsert_author(author_payload)
            # Second upsert (duplicate)
            await repository.upsert_author(author_payload)
            
            # --- 3. Test VkPost Idempotency ---
            post_payload = {
                "id": 200,
                "owner_id": 100,
                "from_id": 500,
                "date": 1715126400,
                "text": "Hello VK Post",
            }
            # First upsert
            await repository.upsert_post(post_payload, task_id=1, group_id=100)
            # Second upsert (duplicate) with updated text
            updated_post_payload = post_payload.copy()
            updated_post_payload["text"] = "Hello VK Post Updated"
            await repository.upsert_post(updated_post_payload, task_id=2, group_id=100)
            
            # --- 4. Test VkComment Idempotency ---
            comment_payload = {
                "id": 300,
                "owner_id": 100,
                "post_id": 200,
                "from_id": 500,
                "date": 1715126400,
                "text": "Hello VK Comment",
            }
            # First upsert
            await repository.upsert_comment(comment_payload, task_id=1)
            # Second upsert (duplicate) with updated text
            updated_comment_payload = comment_payload.copy()
            updated_comment_payload["text"] = "Hello VK Comment Updated"
            await repository.upsert_comment(updated_comment_payload, task_id=2)

        # Assertions (outside transaction to ensure commit / flush)
        # 1. VkGroup asserts
        groups = (await session.scalars(select(VkGroup).where(VkGroup.vk_group_id == 100))).all()
        assert len(groups) == 1
        assert groups[0].name == "Group 100 Updated"
        
        # 2. VkAuthor asserts
        authors = (await session.scalars(select(VkAuthor).where(VkAuthor.vk_author_id == 500))).all()
        assert len(authors) == 1
        assert authors[0].display_name == "Author 500"
        
        # 3. VkPost asserts
        posts = (await session.scalars(select(VkPost).where(VkPost.vk_post_id == 200))).all()
        assert len(posts) == 1
        assert posts[0].text == "Hello VK Post Updated"
        assert posts[0].last_task_id == 2
        assert posts[0].first_task_id == 1
        
        # 4. VkComment asserts
        comments = (await session.scalars(select(VkComment).where(VkComment.vk_comment_id == 300))).all()
        assert len(comments) == 1
        assert comments[0].text == "Hello VK Comment Updated"
        assert comments[0].last_task_id == 2
        assert comments[0].first_task_id == 1
        
    await engine.dispose()


@pytest.mark.anyio
async def test_ingestion_service_idempotency_with_db():
    # Setup asynchronous sqlite database in-memory
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    
    # Create only the 4 tested tables manually
    async with engine.begin() as conn:
        await conn.run_sync(VkGroup.__table__.create)
        await conn.run_sync(VkAuthor.__table__.create)
        await conn.run_sync(VkPost.__table__.create)
        await conn.run_sync(VkComment.__table__.create)
        
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    from app.modules.vk_api.fake_client import FakeVkApiClient
    from test_ingestion import FakeTasksClient, task_run
    
    async with async_session() as session:
        # Инициализируем реальный репозиторий с сессией БД
        repository = IngestionRepository(session)
        tasks_client = FakeTasksClient()
        
        # Создаем сервис с реальным БД-репозиторием и фейковыми клиентами
        from app.modules.ingestion.service import IngestionService
        service = IngestionService(
            adapter=FakeVkApiClient(),
            repository=repository,
            tasks_client=tasks_client,
            default_group_ids=[1]
        )
        
        # Запускаем сбор первый раз
        run1 = task_run(scope="selected", group_ids=[1])
        run1.task_id = 101
        run1.run_id = "run-101"
        run1.status = "running"
        await service.execute(run1)
        await session.commit()
        
        # Запускаем сбор второй раз (replay) с тем же group_id
        run2 = task_run(scope="selected", group_ids=[1])
        run2.task_id = 101
        run2.run_id = "run-102"
        run2.status = "running"
        await service.execute(run2)
        await session.commit()

        # Проверяем, что в БД нет дубликатов!
        groups = (await session.scalars(select(VkGroup))).all()
        # FakeVkApiClient собирает группу с id=1
        assert len(groups) == 1
        assert groups[0].vk_group_id == 1

        posts = (await session.scalars(select(VkPost))).all()
        # FakeVkApiClient возвращает 1 пост для группы (id=1)
        assert len(posts) == 1
        assert posts[0].vk_post_id == 1

        comments = (await session.scalars(select(VkComment))).all()
        # FakeVkApiClient возвращает 1 комментарий для поста (id=1001)
        assert len(comments) == 1
        assert comments[0].vk_comment_id == 1001

        authors = (await session.scalars(select(VkAuthor))).all()
        # Авторы постов и комментариев (from_id=-1 для поста, from_id=1 для комментария)
        # Уникальных авторов должно быть ровно 2
        assert len(authors) == 2
        
    await engine.dispose()

