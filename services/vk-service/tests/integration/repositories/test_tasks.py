from uuid import uuid4

import pytest
from sqlalchemy import func, select

from app.infrastructure.db.models.tasks import ProcessedEvent
from app.infrastructure.db.repositories.tasks import SqlAlchemyTaskEventsRepository


@pytest.mark.anyio
async def test_task_event_inbox_is_idempotent(db_session):
    repository = SqlAlchemyTaskEventsRepository(db_session)
    event_id = uuid4()

    assert not await repository.is_processed("consumer-1", event_id)

    await repository.mark_processed("consumer-1", event_id, "task.created")
    await repository.mark_processed("consumer-1", event_id, "task.created")

    assert await repository.is_processed("consumer-1", event_id)
    count = await db_session.scalar(
        select(func.count(ProcessedEvent.id)).where(
            ProcessedEvent.consumer_name == "consumer-1",
            ProcessedEvent.event_id == event_id,
        )
    )
    assert count == 1


@pytest.mark.anyio
async def test_same_event_id_is_isolated_by_consumer(db_session):
    repository = SqlAlchemyTaskEventsRepository(db_session)
    event_id = uuid4()

    await repository.mark_processed("consumer-1", event_id, "task.created")

    assert await repository.is_processed("consumer-1", event_id)
    assert not await repository.is_processed("consumer-2", event_id)
