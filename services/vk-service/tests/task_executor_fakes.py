from datetime import UTC, datetime
from uuid import uuid4

from app.domain.entities.tasks import VkTaskRun
from app.tasks.task_executor import TaskExecutor


def task_run(*, attempts: int = 1) -> VkTaskRun:
    now = datetime.now(UTC)
    return VkTaskRun(
        id=uuid4(),
        task_id=10,
        owner_user_id="user-1",
        run_id="run-10",
        status="running",
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=1,
        started_at=now,
        finished_at=None,
        processed_items=0,
        total_items=0,
        last_error=None,
        attempts=attempts,
        available_at=now,
        lease_owner="worker-1",
        lease_expires_at=now,
        heartbeat_at=now,
        created_at=now,
        updated_at=now,
    )


class FakeLeaseStore:
    def __init__(self, *, renew=True):
        self.renew_result = renew
        self.calls = []

    async def renew(self, **kwargs):
        self.calls.append(("renew", kwargs))
        return self.renew_result

    async def done(self, **kwargs):
        self.calls.append(("done", kwargs))
        return True

    async def failed(self, **kwargs):
        self.calls.append(("failed", kwargs))
        return True

    async def release(self, **kwargs):
        self.calls.append(("release", kwargs))
        return True


class FakeTasksClient:
    def __init__(self):
        self.calls = []

    async def start_execution(self, *args, **kwargs):
        self.calls.append(("start", args, kwargs))
        return {"status": "running"}

    async def fail_execution(self, *args, **kwargs):
        self.calls.append(("fail", args, kwargs))
        return {"status": "failed"}


class FakeSession:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None

    async def commit(self):
        return None

    async def rollback(self):
        return None


def build_executor(service, lease_store, tasks_client, **overrides):
    options = {
        "lease_seconds": 1,
        "heartbeat_seconds": 0.01,
        "timeout_seconds": 1,
        "max_attempts": 3,
    }
    options.update(overrides)
    return TaskExecutor(
        worker_id="worker-1",
        lease_store=lease_store,
        session_factory=FakeSession,
        ingestion_factory=lambda _session: service,
        tasks_client=tasks_client,
        **options,
    )
