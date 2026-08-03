from common.runtime import WorkerHealth
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.bootstrap import (
    get_ingestion_service,
    get_provider_account_repository,
    get_vk_client,
)
from app.core.config import settings
from app.tasks.account_gate import AccountGate
from app.tasks.execution_executor import ExecutionExecutor
from app.tasks.execution_store import ExecutionStore
from app.tasks.execution_worker import ExecutionWorker


def build_execution_worker(
    session_factory: async_sessionmaker,
    health: WorkerHealth,
) -> ExecutionWorker:
    execution_store = ExecutionStore(session_factory)
    account_gate = AccountGate(session_factory, get_provider_account_repository)

    def executor_factory(worker_id: str) -> ExecutionExecutor:
        return ExecutionExecutor(
            worker_id=worker_id,
            execution_store=execution_store,
            session_factory=session_factory,
            ingestion_factory=lambda session, adapter, attempt_control: get_ingestion_service(
                session,
                adapter=adapter,
                attempt_control=attempt_control,
            ),
            vk_client=get_vk_client(),
            provider_accounts_factory=get_provider_account_repository,
            lease_seconds=settings.task_lease_seconds,
            heartbeat_seconds=settings.task_heartbeat_seconds,
            timeout_seconds=settings.task_timeout_seconds,
            max_attempts=settings.task_max_attempts,
            account_gate=account_gate,
        )

    return ExecutionWorker(
        execution_store=execution_store,
        executor_factory=executor_factory,
        concurrency=settings.task_worker_concurrency,
        poll_seconds=settings.task_worker_poll_seconds,
        lease_seconds=settings.task_lease_seconds,
        shutdown_grace_seconds=settings.task_shutdown_grace_seconds,
        health=health,
        account_gate=account_gate,
    )
