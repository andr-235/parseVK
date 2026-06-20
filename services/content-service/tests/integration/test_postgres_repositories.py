from uuid import uuid4

import pytest
from app.infrastructure.db.models import (
    ContentAuthor,
    ContentComment,
    ContentGroup,
    ContentPost,
    ImMessage,
    ProcessedEvent,
)
from app.infrastructure.db.repositories.authors import AuthorRepository
from app.infrastructure.db.repositories.groups import GroupRepository
from app.infrastructure.db.repositories.im_projection import (
    ImProjectionRepository,
)
from app.infrastructure.db.repositories.processed_events import (
    SqlAlchemyProcessedEventRepository,
)
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine


@pytest.mark.anyio
async def test_im_upsert_is_idempotent(postgres_url, migrated_postgres):
    engine = create_async_engine(postgres_url)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    message_id = f"message-{uuid4()}"
    try:
        async with sessions.begin() as session:
            repository = ImProjectionRepository(session)
            await repository.upsert_message("whatsapp", message_id, "chat-1")
            await repository.upsert_message("whatsapp", message_id, "chat-1")
        async with sessions() as session:
            count = await session.scalar(
                select(func.count(ImMessage.id)).where(
                    ImMessage.external_id == message_id
                )
            )
        assert count == 1
    finally:
        await engine.dispose()


@pytest.mark.anyio
async def test_processed_event_write_rolls_back(postgres_url, migrated_postgres):
    engine = create_async_engine(postgres_url)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    event_id = uuid4()
    try:
        with pytest.raises(RuntimeError, match="force rollback"):
            async with sessions.begin() as session:
                repository = SqlAlchemyProcessedEventRepository(session)
                await repository.mark_processed("rollback-test", event_id, "test")
                raise RuntimeError("force rollback")
        async with sessions() as session:
            count = await session.scalar(
                select(func.count(ProcessedEvent.id)).where(
                    ProcessedEvent.event_id == event_id
                )
            )
        assert count == 0
    finally:
        await engine.dispose()


@pytest.mark.anyio
async def test_author_filters_and_offset_pagination(postgres_url, migrated_postgres):
    engine = create_async_engine(postgres_url)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    marker = uuid4().hex[:8]
    try:
        async with sessions.begin() as session:
            session.add_all(
                [
                    ContentAuthor(
                        vk_author_id=int(f"91{marker[:6]}", 16),
                        type="user",
                        display_name=f"Alpha {marker}",
                        city={"title": "Yakutsk"},
                    ),
                    ContentAuthor(
                        vk_author_id=int(f"92{marker[:6]}", 16),
                        type="user",
                        display_name=f"Beta {marker}",
                        city={"title": "Yakutsk"},
                    ),
                ]
            )
        async with sessions() as session:
            page = await AuthorRepository(session).list_authors(
                offset=1,
                limit=1,
                search=marker,
                city="Yakutsk",
                sort_by="fullName",
                sort_order="asc",
            )
        assert page["total"] == 2
        assert len(page["items"]) == 1
        assert page["items"][0]["fullName"] == f"Beta {marker}"
        assert page["hasMore"] is False
    finally:
        await engine.dispose()


@pytest.mark.anyio
async def test_processed_event_uniqueness_constraint(postgres_url, migrated_postgres):
    engine = create_async_engine(postgres_url)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    event_id = uuid4()
    try:
        with pytest.raises(IntegrityError):
            async with sessions.begin() as session:
                session.add_all(
                    [
                        ProcessedEvent(
                            consumer_name="unique-test",
                            event_id=event_id,
                            event_type="test",
                        ),
                        ProcessedEvent(
                            consumer_name="unique-test",
                            event_id=event_id,
                            event_type="test",
                        ),
                    ]
                )
                await session.flush()
    finally:
        await engine.dispose()


@pytest.mark.anyio
async def test_group_delete_removes_related_rows(postgres_url, migrated_postgres):
    engine = create_async_engine(postgres_url)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    group_id = int(uuid4().hex[:8], 16)
    owner_id = -group_id
    post_key = f"{owner_id}:1"
    try:
        async with sessions.begin() as session:
            session.add_all(
                [
                    ContentGroup(vk_group_id=group_id, name="Cascade test"),
                    ContentAuthor(vk_author_id=owner_id, type="group"),
                    ContentPost(
                        external_key=post_key,
                        vk_owner_id=owner_id,
                        vk_post_id=1,
                        author_vk_id=owner_id,
                    ),
                    ContentComment(
                        external_key=f"{post_key}:1",
                        post_external_key=post_key,
                        vk_owner_id=owner_id,
                        vk_post_id=1,
                        vk_comment_id=1,
                        author_vk_id=owner_id,
                    ),
                ]
            )
        async with sessions.begin() as session:
            await GroupRepository(session).delete_group_and_related(group_id)
        async with sessions() as session:
            remaining = [
                await session.scalar(
                    select(func.count(model.id)).where(condition)
                )
                for model, condition in (
                    (ContentGroup, ContentGroup.vk_group_id == group_id),
                    (ContentAuthor, ContentAuthor.vk_author_id == owner_id),
                    (ContentPost, ContentPost.vk_owner_id == owner_id),
                    (ContentComment, ContentComment.vk_owner_id == owner_id),
                )
            ]
        assert remaining == [0, 0, 0, 0]
    finally:
        await engine.dispose()
