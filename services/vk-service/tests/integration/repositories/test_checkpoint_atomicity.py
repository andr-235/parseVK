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
async def test_crash_resume_full_flow(db_session):
    """End-to-end: crash after 2 pages, resume with overlap, verify uniqueness and stats.

    Scenario:
    1. Insert comments 1-100 + checkpoint offset=100 -> COMMIT
    2. Insert comments 101-200 + checkpoint offset=200 -> COMMIT
    3. Simulate crash: open new session, VK returns overlap (comments 190-250)
    4. Verify: 250 unique comments total, checkpoint completed,
       processed_comments=250 (200 base + 50 new comments persisted)
    """
    from types import SimpleNamespace
    from unittest.mock import AsyncMock

    from app.domain.repositories.checkpoint import CheckpointData
    from app.infrastructure.db.repositories.checkpoint import SqlAlchemyIngestionCheckpointStore
    from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository
    from app.infrastructure.db.session import SessionLocal
    from app.services.ingestion.comment_collector import CommentCollector

    run_id = "resume-full-run"
    task_id = 10
    owner_id = -1
    post_id = 100
    group_id = 1

    # ---- Phase 1: comments 1-100, checkpoint offset=100 ----
    store1 = SqlAlchemyIngestionCheckpointStore(db_session)
    repo1 = SqlAlchemyIngestionRepository(db_session)
    for i in range(1, 101):
        await repo1.upsert_comment(
            {"id": i, "owner_id": owner_id, "post_id": post_id,
             "from_id": 1, "text": f"comment {i}", "date": 1_700_000_000 + i},
            task_id=task_id,
        )
    cp1 = CheckpointData(
        run_id=run_id, owner_id=owner_id, post_id=post_id,
        task_id=task_id, group_id=group_id,
        next_offset=100, processed_comments=100, status="in_progress",
    )
    await store1.save(cp1)
    await db_session.commit()

    # ---- Phase 2: comments 101-200, checkpoint offset=200 ----
    async with SessionLocal() as s2:
        store2 = SqlAlchemyIngestionCheckpointStore(s2)
        repo2 = SqlAlchemyIngestionRepository(s2)
        for i in range(101, 201):
            await repo2.upsert_comment(
                {"id": i, "owner_id": owner_id, "post_id": post_id,
                 "from_id": 2, "text": f"comment {i}", "date": 1_700_000_000 + i},
                task_id=task_id,
            )
        cp2 = CheckpointData(
            run_id=run_id, owner_id=owner_id, post_id=post_id,
            task_id=task_id, group_id=group_id,
            next_offset=200, processed_comments=200, status="in_progress",
        )
        await store2.save(cp2)
        await s2.commit()

    # ---- Phase 3: resume with overlap (VK returns 190-250) ----
    async with SessionLocal() as s3:
        store3 = SqlAlchemyIngestionCheckpointStore(s3)
        repo3 = SqlAlchemyIngestionRepository(s3)

        # VK returns overlap: 190-250 (items 190-200 already exist from phases 1-2)
        overlap_page = {
            "items": [
                {"id": i, "owner_id": owner_id, "post_id": post_id,
                 "from_id": 1 if i % 2 == 0 else 2,
                 "text": f"comment {i}", "date": 1_700_000_000 + i}
                for i in range(190, 251)
            ],
            "profiles": [{"id": 1, "first_name": "Alice"}, {"id": 2, "first_name": "Bob"}],
            "groups": [],
        }
        empty_page = {"items": [], "profiles": [], "groups": []}

        adapter = AsyncMock(spec=[])
        async def _iter(*args, **kwargs):
            yield overlap_page
            yield empty_page
        adapter.iter_comment_pages = _iter

        collector = CommentCollector(adapter=adapter, repository=repo3)
        task_run = SimpleNamespace(task_id=task_id, run_id=run_id)

        count = await collector.collect_for_post(
            owner_id=owner_id, post_id=post_id, author_profiles={},
            task_run=task_run, checkpoint_store=store3,
            start_offset=200, group_id=group_id, base_processed_comments=200,
        )
        # count should be 50 (items 201-250 are new; 190-200 exist from phases 1-2)
        assert count == 50, f"Expected 50 new comments, got {count}"
        await store3.complete(run_id, owner_id, post_id)
        await s3.commit()

    # ---- Phase 4: verify final state ----
    from sqlalchemy import func, select

    from app.infrastructure.db.models.vk_ingestion import VkComment

    async with SessionLocal() as s4:
        store4 = SqlAlchemyIngestionCheckpointStore(s4)

        # Count unique comments by id
        result = await s4.execute(
            select(func.count(VkComment.id.distinct())).where(
                VkComment.vk_owner_id == owner_id,
                VkComment.vk_post_id == post_id,
            )
        )
        total_comments = result.scalar()
        assert total_comments == 250, f"Expected 250 unique comments, got {total_comments}"

        cp = await store4.load(run_id, owner_id, post_id)
        assert cp is not None
        assert cp.status == "completed", f"Expected completed, got {cp.status}"
        assert cp.processed_comments == 250, f"Expected 250, got {cp.processed_comments}"


@pytest.mark.anyio
async def test_crash_after_overlap_page_checkpoint_then_resume(db_session):
    """Regression: crash after page checkpoint during cross-run overlap, then resume.

    Scenario:
    1. Insert comments 1-200, checkpoint processed_comments=200, commit.
    2. New session: resume with overlap 190-250, collect_for_post.
       - Page 1 (190-250): comments upserted, checkpoint saved with DB-true count (250).
       - Adapter raises exception -> crash BEFORE terminal reconciliation.
    3. Verify checkpoint processed_comments=250 (not 261), total comments=250.
    4. New session: resume again, collect_for_post, should return 0 new, no overcount.
    """
    from types import SimpleNamespace
    from unittest.mock import AsyncMock

    from app.domain.repositories.checkpoint import CheckpointData
    from app.infrastructure.db.repositories.checkpoint import SqlAlchemyIngestionCheckpointStore
    from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository
    from app.infrastructure.db.session import SessionLocal
    from app.services.ingestion.comment_collector import CommentCollector

    run_id = "crash-overlap-run"
    task_id = 10
    owner_id = -1
    post_id = 200
    group_id = 1

    # ---- Phase 1: comments 1-200, checkpoint offset=200 ----
    store1 = SqlAlchemyIngestionCheckpointStore(db_session)
    repo1 = SqlAlchemyIngestionRepository(db_session)
    for i in range(1, 201):
        await repo1.upsert_comment(
            {"id": i, "owner_id": owner_id, "post_id": post_id,
             "from_id": 1, "text": f"comment {i}", "date": 1_700_000_000 + i},
            task_id=task_id,
        )
    cp1 = CheckpointData(
        run_id=run_id, owner_id=owner_id, post_id=post_id,
        task_id=task_id, group_id=group_id,
        next_offset=200, processed_comments=200, status="in_progress",
    )
    await store1.save(cp1)
    await db_session.commit()

    # ---- Phase 2: resume with overlap page, then crash ----
    async with SessionLocal() as s2:
        store2 = SqlAlchemyIngestionCheckpointStore(s2)
        repo2 = SqlAlchemyIngestionRepository(s2)

        overlap_page = {
            "items": [
                {"id": i, "owner_id": owner_id, "post_id": post_id,
                 "from_id": 1 if i % 2 == 0 else 2,
                 "text": f"comment {i}", "date": 1_700_000_000 + i}
                for i in range(190, 251)
            ],
            "profiles": [{"id": 1, "first_name": "Alice"}, {"id": 2, "first_name": "Bob"}],
            "groups": [],
        }

        async def _iter_with_crash(*args, **kwargs):
            yield overlap_page
            raise RuntimeError("Simulated crash after page checkpoint")

        adapter = AsyncMock(spec=[])
        adapter.iter_comment_pages = _iter_with_crash

        collector = CommentCollector(adapter=adapter, repository=repo2)
        task_run = SimpleNamespace(task_id=task_id, run_id=run_id)

        with pytest.raises(RuntimeError, match="Simulated crash"):
            await collector.collect_for_post(
                owner_id=owner_id, post_id=post_id, author_profiles={},
                task_run=task_run, checkpoint_store=store2,
                start_offset=200, group_id=group_id, base_processed_comments=200,
            )

        await s2.commit()

    # ---- Phase 3: verify checkpoint survived crash with DB-true count ----
    from sqlalchemy import func, select

    from app.infrastructure.db.models.vk_ingestion import VkComment

    async with SessionLocal() as s3:
        store3 = SqlAlchemyIngestionCheckpointStore(s3)

        # Verify DB has 250 unique comments
        result = await s3.execute(
            select(func.count(VkComment.id.distinct())).where(
                VkComment.vk_owner_id == owner_id,
                VkComment.vk_post_id == post_id,
            )
        )
        total = result.scalar()
        assert total == 250, f"Expected 250 unique comments, got {total}"

        # Verify checkpoint has DB-true count, NOT 261
        cp = await store3.load(run_id, owner_id, post_id)
        assert cp is not None
        assert cp.processed_comments == 250, \
            f"Expected 250 (DB-backed), got {cp.processed_comments}"
        assert cp.next_offset == 261, \
            f"Expected next_offset=261 (61 fetched items), got {cp.next_offset}"
        assert cp.status == "in_progress"

    # ---- Phase 4: resume again, should return 0 new ----
    async with SessionLocal() as s4:
        store4 = SqlAlchemyIngestionCheckpointStore(s4)
        repo4 = SqlAlchemyIngestionRepository(s4)

        empty_page = {"items": [], "profiles": [], "groups": []}
        async def _iter_empty(*args, **kwargs):
            yield empty_page

        adapter2 = AsyncMock(spec=[])
        adapter2.iter_comment_pages = _iter_empty

        collector2 = CommentCollector(adapter=adapter2, repository=repo4)
        count = await collector2.collect_for_post(
            owner_id=owner_id, post_id=post_id, author_profiles={},
            task_run=task_run, checkpoint_store=store4,
            start_offset=261, group_id=group_id, base_processed_comments=250,
        )
        assert count == 0, f"Expected 0 new comments, got {count}"
        await store4.complete(run_id, owner_id, post_id)
        await s4.commit()

    # ---- Phase 5: verify final state ----
    async with SessionLocal() as s5:
        store5 = SqlAlchemyIngestionCheckpointStore(s5)
        cp = await store5.load(run_id, owner_id, post_id)
        assert cp is not None
        assert cp.status == "completed"
        assert cp.processed_comments == 250, \
            f"Expected 250, got {cp.processed_comments}"


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
