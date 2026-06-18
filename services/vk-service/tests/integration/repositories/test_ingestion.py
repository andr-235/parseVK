import pytest
from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository

@pytest.mark.anyio
async def test_ingestion_repository_flow(db_session):
    repo = SqlAlchemyIngestionRepository(db_session)
    
    # 1. Upsert Group
    group_data = {"id": 123, "screen_name": "test_grp", "name": "Test Group", "is_closed": 0}
    await repo.upsert_group(group_data, revive_if_deleted=True)
    
    # 2. Get active group IDs
    active_ids = await repo.get_active_group_ids()
    assert 123 in active_ids
    
    # 3. Upsert Author
    author_data = {"vk_author_id": 456, "type": "user", "display_name": "John Doe", "raw": {}}
    await repo.upsert_author(author_data)
    
    # 4. Upsert Post
    post_data = {"id": 789, "owner_id": -123, "from_id": 456, "date": 1700000000, "text": "Hello world"}
    await repo.upsert_post(post_data, task_id=1, group_id=123)
    
    # 5. Upsert Comment
    comment_data = {"id": 999, "owner_id": -123, "post_id": 789, "from_id": 456, "date": 1700000010, "text": "My comment"}
    await repo.upsert_comment(comment_data, task_id=1)
