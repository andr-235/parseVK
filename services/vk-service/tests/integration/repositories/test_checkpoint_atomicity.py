import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from _service_path import use_service_path

use_service_path()

from app.domain.repositories.checkpoint import CheckpointData
from app.infrastructure.db.repositories.checkpoint import SqlAlchemyIngestionCheckpointStore
from app.infrastructure.db.session import SessionLocal


@pytest.mark.anyio
async def test_page_commit_visible_to_another_session(db_session):
    store = SqlAlchemyIngestionCheckpointStore(db_session)

    checkpoint = CheckpointData(
        run_id="run-1",
        owner_id=-1,
        post_id=42,
        task_id=10,
        group_id=1,
        next_offset=100,
    )
    await store.save(checkpoint)
    await db_session.commit()

    async with SessionLocal() as new_session:
        new_store = SqlAlchemyIngestionCheckpointStore(new_session)
        loaded = await new_store.load("run-1", -1, 42)

    assert loaded is not None
    assert loaded.next_offset == 100
    assert loaded.status == "in_progress"


@pytest.mark.anyio
async def test_crash_simulation_two_of_three_pages(db_session):
    store = SqlAlchemyIngestionCheckpointStore(db_session)

    for offset in [0, 100]:
        await store.save(
            CheckpointData(
                run_id="run-crash",
                owner_id=-1,
                post_id=42,
                task_id=10,
                group_id=1,
                next_offset=offset + 100,
                processed_comments=offset + 100,
                status="in_progress",
            )
        )

    loaded = await store.load("run-crash", -1, 42)
    assert loaded is not None
    assert loaded.next_offset == 200
    assert loaded.processed_comments == 200

    third_page = await store.load("run-crash", -1, 99)
    assert third_page is None


@pytest.mark.anyio
async def test_restart_resume_from_checkpoint(db_session):
    store = SqlAlchemyIngestionCheckpointStore(db_session)

    await store.save(
        CheckpointData(
            run_id="run-resume",
            owner_id=-1,
            post_id=42,
            task_id=10,
            group_id=1,
            next_offset=100,
            last_comment_id=123,
            processed_comments=100,
            status="in_progress",
        )
    )

    loaded = await store.load("run-resume", -1, 42)
    assert loaded is not None
    assert loaded.next_offset == 100
    assert loaded.status == "in_progress"
    resume_offset = loaded.next_offset
    assert resume_offset == 100


@pytest.mark.anyio
async def test_page_rollback_no_checkpoint(db_session):
    store = SqlAlchemyIngestionCheckpointStore(db_session)

    checkpoint = CheckpointData(
        run_id="run-rollback",
        owner_id=-1,
        post_id=99,
        task_id=10,
        group_id=1,
        next_offset=50,
    )
    await store.save(checkpoint)
    await db_session.rollback()

    async with SessionLocal() as new_session:
        new_store = SqlAlchemyIngestionCheckpointStore(new_session)
        loaded = await new_store.load("run-rollback", -1, 99)

    assert loaded is None


@pytest.mark.anyio
async def test_cancelled_error_rollback(db_session):
    store = SqlAlchemyIngestionCheckpointStore(db_session)

    checkpoint = CheckpointData(
        run_id="run-cancel",
        owner_id=-1,
        post_id=88,
        task_id=10,
        group_id=1,
        next_offset=100,
    )
    await store.save(checkpoint)
    await db_session.rollback()

    async with SessionLocal() as new_session:
        new_store = SqlAlchemyIngestionCheckpointStore(new_session)
        loaded = await new_store.load("run-cancel", -1, 88)

    assert loaded is None


@pytest.mark.anyio
async def test_checkpoint_and_comments_atomic(db_session):
    from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository

    repo = SqlAlchemyIngestionRepository(db_session)
    store = SqlAlchemyIngestionCheckpointStore(db_session)

    author_data = {"vk_author_id": 1, "type": "user", "display_name": "Alice", "raw": {}}
    await repo.upsert_author(author_data)

    comment_data = {
        "id": 1,
        "owner_id": -1,
        "post_id": 42,
        "from_id": 1,
        "date": 1700000000,
        "text": "atomic comment",
    }
    await repo.upsert_comment(comment_data, task_id=10)

    await store.save(
        CheckpointData(
            run_id="run-atomic",
            owner_id=-1,
            post_id=42,
            task_id=10,
            group_id=1,
            next_offset=100,
            last_comment_id=1,
            processed_comments=1,
            status="in_progress",
        )
    )
    await db_session.commit()

    from sqlalchemy import select

    from app.infrastructure.db.models.vk_ingestion import VkComment

    async with SessionLocal() as new_session:
        new_store = SqlAlchemyIngestionCheckpointStore(new_session)
        loaded_checkpoint = await new_store.load("run-atomic", -1, 42)
        comment_result = await new_session.execute(
            select(VkComment).where(VkComment.vk_comment_id == 1)
        )
        loaded_comment = comment_result.scalar_one_or_none()

    assert loaded_checkpoint is not None
    assert loaded_checkpoint.next_offset == 100
    assert loaded_comment is not None
    assert loaded_comment.text == "atomic comment"


@pytest.mark.anyio
async def test_complete_transition(db_session):
    store = SqlAlchemyIngestionCheckpointStore(db_session)

    await store.save(
        CheckpointData(
            run_id="run-complete",
            owner_id=-1,
            post_id=42,
            task_id=10,
            group_id=1,
            next_offset=100,
            processed_comments=100,
            status="in_progress",
        )
    )
    await db_session.commit()

    async with SessionLocal() as first_session:
        first_store = SqlAlchemyIngestionCheckpointStore(first_session)
        loaded = await first_store.load("run-complete", -1, 42)
        assert loaded is not None
        assert loaded.status == "in_progress"

        await first_store.complete("run-complete", -1, 42)
        await first_session.commit()

    async with SessionLocal() as new_session:
        new_store = SqlAlchemyIngestionCheckpointStore(new_session)
        completed = await new_store.load("run-complete", -1, 42)

    assert completed is not None
    assert completed.status == "completed"
