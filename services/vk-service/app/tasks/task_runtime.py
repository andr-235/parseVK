from common.runtime import WorkerHealth
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.bootstrap import get_ingestion_service, get_tasks_client
from app.core.config import settings
from app.tasks.lease_store import TaskLeaseStore
from app.tasks.task_executor import TaskExecutor
from app.tasks.task_worker import TaskWorker


def build_task_worker(
    session_factory: async_sessionmaker,
    health: WorkerHealth,
) -> TaskWorker:
    lease_store = TaskLeaseStore(session_factory)

    def executor_factory(worker_id: str) -> TaskExecutor:
        return TaskExecutor(
            worker_id=worker_id,
            lease_store=lease_store,
            session_factory=session_factory,
            ingestion_factory=get_ingestion_service,
            tasks_client=get_tasks_client(),
            lease_seconds=settings.task_lease_seconds,
            heartbeat_seconds=settings.task_heartbeat_seconds,
            timeout_seconds=settings.task_timeout_seconds,
            max_attempts=settings.task_max_attempts,
        )

    return TaskWorker(
        lease_store=lease_store,
        executor_factory=executor_factory,
        concurrency=settings.task_worker_concurrency,
        poll_seconds=settings.task_worker_poll_seconds,
        lease_seconds=settings.task_lease_seconds,
        health=health,
    )
