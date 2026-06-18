import uuid
import pytest
from app.infrastructure.db.repositories.vk_friends import SqlAlchemyVkFriendsRepository

@pytest.mark.anyio
async def test_vk_friends_repository_flow(db_session):
    repo = SqlAlchemyVkFriendsRepository(db_session)
    
    # 1. Create Job
    params = {"target": "user", "user_id": 12345}
    job = await repo.create_job(params, vk_user_id=12345)
    assert job.id is not None
    assert job.status == "RUNNING"
    assert job.fetched_count == 0
    assert job.vk_user_id == 12345
    assert job.params == params
    
    # 2. Get Job By ID
    fetched = await repo.get_job_by_id(job.id)
    assert fetched is not None
    assert fetched.id == job.id
    
    # 3. Get Logs (should have 1 starting log)
    logs = await repo.get_job_logs(job.id)
    assert len(logs) == 1
    assert logs[0].message == "Export started"
    
    # 4. Append log
    await repo.append_log(job.id, "debug", "test message")
    logs = await repo.get_job_logs(job.id)
    assert len(logs) == 2
    assert logs[0].message == "test message" or logs[1].message == "test message"
    
    # 5. Update progress
    await repo.update_progress(job.id, fetched_count=10, total_count=100)
    fetched = await repo.get_job_by_id(job.id)
    assert fetched.fetched_count == 10
    assert fetched.total_count == 100
    
    # 6. Save friends batch
    records = [
        {"vkFriendId": 111, "payload": {"first_name": "A"}},
        {"vkFriendId": 222, "payload": {"first_name": "B"}},
    ]
    await repo.save_friends_batch(job.id, records)
    
    # 7. Complete job
    await repo.complete_job(job.id, fetched_count=20, total_count=100, warning="warn", xlsx_path="path/to.xlsx")
    fetched = await repo.get_job_by_id(job.id)
    assert fetched.status == "DONE"
    assert fetched.xlsx_path == "path/to.xlsx"
    assert fetched.warning == "warn"
    
    # 8. Fail job
    job2 = await repo.create_job(params, vk_user_id=555)
    await repo.fail_job(job2.id, error="failed error", fetched_count=5)
    fetched2 = await repo.get_job_by_id(job2.id)
    assert fetched2.status == "FAILED"
    assert fetched2.error == "failed error"
