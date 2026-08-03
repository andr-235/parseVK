from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from app.infrastructure.db.repositories.tasks import SqlAlchemyTaskEventsRepository


@pytest.mark.anyio
async def test_task_events_repository_flow(db_session):
    repository = SqlAlchemyTaskEventsRepository(db_session)
    event_id = uuid4()

    assert not await repository.is_processed("consumer-1", event_id)
    await repository.mark_processed("consumer-1", event_id, "task.created")
    assert await repository.is_processed("consumer-1", event_id)

    assert await repository.get_execution(456, "run-1") is None
    execution = await repository.create_execution(
        task_id=456,
        owner_user_id="user-1",
        run_id="run-1",
        scope="selected",
        mode="recent_posts",
        group_ids=[123],
        post_limit=10,
        plan_snapshot={"groupIds": [123], "postLimit": 10},
        parent_execution_id=None,
    )

    assert execution.task_id == 456
    assert execution.status == "pending"
    assert execution.group_ids == [123]

    fetched = await repository.get_execution(456, "run-1")
    assert fetched is not None
    assert fetched.id == execution.id
    assert fetched.plan_snapshot["groupIds"] == [123]
    assert (await repository.get_active_execution(456)).id == execution.id
    assert (await repository.get_latest_execution(456)).id == execution.id


@pytest.mark.anyio
async def test_only_one_active_execution_is_allowed_per_task(db_session):
    repository = SqlAlchemyTaskEventsRepository(db_session)
    await repository.create_execution(
        task_id=458,
        owner_user_id="user-1",
        run_id="run-a",
        scope="selected",
        mode="recent_posts",
        group_ids=[123],
        post_limit=10,
        plan_snapshot={"groupIds": [123]},
        parent_execution_id=None,
    )

    with pytest.raises(IntegrityError):
        async with db_session.begin_nested():
            await repository.create_execution(
                task_id=458,
                owner_user_id="user-1",
                run_id="run-b",
                scope="selected",
                mode="recent_posts",
                group_ids=[123],
                post_limit=10,
                plan_snapshot={"groupIds": [123]},
                parent_execution_id=None,
            )


@pytest.mark.anyio
async def test_pending_cancellation_is_idempotent(db_session):
    repository = SqlAlchemyTaskEventsRepository(db_session)
    execution = await repository.create_execution(
        task_id=457,
        owner_user_id="user-1",
        run_id="run-2",
        scope="selected",
        mode="recent_posts",
        group_ids=[123],
        post_limit=10,
        plan_snapshot={"groupIds": [123]},
        parent_execution_id=None,
    )

    first = await repository.request_cancellation(
        task_id=457,
        run_id="run-2",
        reason="task.cancelled",
    )
    second = await repository.request_cancellation(
        task_id=457,
        run_id="run-2",
        reason="task.cancelled",
    )

    assert first is not None
    assert first.status == "cancelled"
    assert first.cancellation_reason == "task.cancelled"
    assert second is None
    terminal = await repository.get_execution(457, "run-2")
    assert terminal is not None
    assert terminal.id == execution.id
    assert terminal.status == "cancelled"
