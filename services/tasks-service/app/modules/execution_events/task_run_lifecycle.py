from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def mark_task_run_started(
    session: AsyncSession,
    *,
    task_id: int,
    run_id: str,
) -> None:
    run_uuid = UUID(run_id)
    await session.execute(
        text("""
            UPDATE task_runs
            SET status = 'running'
            WHERE id = :run_id
              AND task_id = :task_id
              AND status = 'requested'
        """),
        {"run_id": run_uuid, "task_id": task_id},
    )


async def mark_task_run_terminal(
    session: AsyncSession,
    *,
    task_id: int,
    run_id: str,
    status: str,
) -> None:
    if status not in {"done", "failed", "cancelled"}:
        raise ValueError(f"Unsupported TaskRun terminal status: {status}")
    run_uuid = UUID(run_id)
    await session.execute(
        text("""
            UPDATE task_runs
            SET status = :status
            WHERE id = :run_id
              AND task_id = :task_id
              AND status IN ('requested', 'running')
        """),
        {"status": status, "run_id": run_uuid, "task_id": task_id},
    )
    await session.execute(
        text("""
            UPDATE task_run_source_demands
            SET status = :status
            WHERE task_run_id = :run_id
              AND status = 'active'
        """),
        {"status": status, "run_id": run_uuid},
    )
