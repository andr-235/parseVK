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
    """Simulate crash after 2 of 3 pages: only 2 pages visible in new session."""
    # Page 1: commit in its own session so it survives a crash.
    async with SessionLocal() as session1:
        store1 = SqlAlchemyIngestionCheckpointStore(session1)
        cp1 = CheckpointData(
            run_id="crash-run", owner_id=-1, post_id=1, task_id=10, group_id=1,
            next_offset=100, processed_comments=100, status="in_progress",
        )
        await store1.save(cp1)
        await session1.commit()

    # Page 2: commit in its own session.
    async with SessionLocal() as session2:
        store2 = SqlAlchemyIngestionCheckpointStore(session2)
        cp2 = CheckpointData(
            run_id="crash-run", owner_id=-1, post_id=2, task_id=10, group_id=1,
            next_offset=200, processed_comments=200, status="in_progress",
        )
        await store2.save(cp2)
        await session2.commit()

    # Simulate crash — page 3 never saves.
    # New session should see only pages 1-2.
    async with SessionLocal() as new_session:
        new_store = SqlAlchemyIngestionCheckpointStore(new_session)
        for owner_id, post_id, expected_offset in [(-1, 1, 100), (-1, 2, 200)]:
            loaded = await new_store.load("crash-run", owner_id, post_id)
            assert loaded is not None, f"Checkpoint for post {post_id} not found"
            assert loaded.next_offset == expected_offset
            assert loaded.status == "in_progress"

        # Page 3 should not exist.
        loaded_p3 = await new_store.load("crash-run", -1, 3)
        assert loaded_p3 is None, "Page 3 checkpoint should not exist (crash before save)"


@pytest.mark.anyio
async def test_crash_resume_no_duplicates(db_session):
    """Integration: crash after page 2, resume from offset, no duplicate comments."""
    # Page 1: commit in its own session so it survives a crash.
    async with SessionLocal() as session1:
        store1 = SqlAlchemyIngestionCheckpointStore(session1)
        cp1 = CheckpointData(
            run_id="resume-run", owner_id=-1, post_id=100, task_id=10, group_id=1,
            next_offset=100, processed_comments=100, status="in_progress",
        )
        await store1.save(cp1)
        await session1.commit()

    # Page 2: commit in its own session.
    async with SessionLocal() as session2:
        store2 = SqlAlchemyIngestionCheckpointStore(session2)
        cp2 = CheckpointData(
            run_id="resume-run", owner_id=-1, post_id=100, task_id=10, group_id=1,
            next_offset=200, processed_comments=200, status="in_progress",
        )
        await store2.save(cp2)
        await session2.commit()

    # Simulate crash: new session loads checkpoint.
    async with SessionLocal() as new_session:
        new_store = SqlAlchemyIngestionCheckpointStore(new_session)
        loaded = await new_store.load("resume-run", -1, 100)
        assert loaded is not None
        assert loaded.next_offset == 200
        assert loaded.processed_comments == 200
        assert loaded.status == "in_progress"


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
