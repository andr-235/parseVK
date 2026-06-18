import pytest
from app.infrastructure.db.repositories.outbox import SqlAlchemyOutboxRepository

@pytest.mark.anyio
async def test_outbox_repository_flow(db_session):
    repo = SqlAlchemyOutboxRepository(db_session)
    
    # 1. List Pending (should be empty)
    pending = await repo.list_pending()
    assert len(pending) == 0
    
    # 2. Add Event
    await repo.add_event(
        event_type="test.event",
        aggregate_type="aggregate",
        aggregate_id="123",
        payload={"foo": "bar"},
        correlation_id="corr-1",
        dedupe_key="key-1"
    )
    
    # 3. List Pending (should have 1 event)
    pending = await repo.list_pending()
    assert len(pending) == 1
    assert pending[0].event_type == "test.event"
    assert pending[0].status == "pending"
    
    # 4. Mark Published
    await repo.mark_published(pending[0])
    
    # 5. List Pending (should be empty again)
    pending = await repo.list_pending()
    assert len(pending) == 0
