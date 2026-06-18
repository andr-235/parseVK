import uuid

import pytest
from app.infrastructure.db.repositories.tasks import SqlAlchemyTaskEventsRepository


@pytest.mark.anyio
async def test_tasks_repository_flow(db_session):
    repo = SqlAlchemyTaskEventsRepository(db_session)
    
    event_id = uuid.uuid4()
    # 1. Is Processed (should be False)
    processed = await repo.is_processed("consumer-1", event_id)
    assert processed is False
    
    # 2. Mark Processed
    await repo.mark_processed("consumer-1", event_id, "task.created")
    
    # 3. Is Processed (should be True now)
    processed = await repo.is_processed("consumer-1", event_id)
    assert processed is True
    
    # 4. Get Task Run (should be None)
    run = await repo.get_task_run(456)
    assert run is None
    
    # 5. Create Task Run
    run = await repo.create_task_run(
        task_id=456,
        owner_user_id="user-1",
        run_id="run-1",
        scope="wall",
        mode="all",
        group_ids=[123],
        post_limit=10
    )
    assert run.task_id == 456
    assert run.status == "pending"
    
    # 6. Fetch again
    run_fetched = await repo.get_task_run(456)
    assert run_fetched is not None
    assert run_fetched.run_id == "run-1"
    
    # 7. Save
    await repo.save()
