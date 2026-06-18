import pytest
from app.infrastructure.db.repositories.ok_friends import SqlAlchemyOkFriendsRepository


@pytest.mark.anyio
async def test_ok_friends_repository_flow(db_session):
    repo = SqlAlchemyOkFriendsRepository(db_session)
    
    # 1. Create Job
    params = {"target": "user", "ok_user_id": 999}
    job = await repo.create_job(params, ok_user_id=999)
    assert job.id is not None
    assert job.status == "RUNNING"
    assert job.fetched_count == 0
    assert job.ok_user_id == 999
    
    # 2. Get Job By ID
    fetched = await repo.get_job_by_id(job.id)
    assert fetched is not None
    assert fetched.id == job.id
    
    # 3. Get Logs
    logs = await repo.get_job_logs(job.id)
    assert len(logs) == 1
    assert logs[0].message == "Export started"
    
    # 4. Append log
    await repo.append_log(job.id, "debug", "test ok log")
    logs = await repo.get_job_logs(job.id)
    assert len(logs) == 2
    
    # 5. Update progress
    await repo.update_progress(job.id, fetched_count=5, total_count=50)
    fetched = await repo.get_job_by_id(job.id)
    assert fetched.fetched_count == 5
    assert fetched.total_count == 50
    
    # 6. Save friends batch
    records = [
        {"okFriendId": 777, "payload": {"name": "User Ok"}}
    ]
    await repo.save_friends_batch(job.id, records)
    
    # 7. Complete job
    await repo.complete_job(job.id, fetched_count=5, total_count=50, warning=None, xlsx_path="ok_path.xlsx")
    fetched = await repo.get_job_by_id(job.id)
    assert fetched.status == "DONE"
    
    # 8. Fail job
    job2 = await repo.create_job(params, ok_user_id=888)
    await repo.fail_job(job2.id, error="failed error ok", fetched_count=0)
    fetched2 = await repo.get_job_by_id(job2.id)
    assert fetched2.status == "FAILED"
    assert fetched2.error == "failed error ok"
