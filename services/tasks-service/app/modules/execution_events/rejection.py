import json
import logging
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.execution_events.outbox import (
    emit_task_failed,
    emit_task_state_changed,
)

logger = logging.getLogger(__name__)

_LOAD_TASK_SQL = text("""
    SELECT id, status, execution_run_id, last_execution_sequence, revision
    FROM tasks WHERE id = :task_id FOR UPDATE
""")


async def apply_rejected(
    session: AsyncSession,
    task_id: int,
    run_id: str,
    execution_sequence: int,
    processed_items: int,
    total_items: int,
    stats: dict | None,
    error: str,
    owner_user_id: str,
) -> bool:
    """Apply a durable command rejection before an execution starts."""

    row = (
        await session.execute(_LOAD_TASK_SQL, {"task_id": task_id})
    ).one_or_none()
    if row is None:
        return True

    status = row[1]
    current_run_id = row[2]
    last_sequence = row[3] or 0
    revision = row[4] or 0
    if execution_sequence <= last_sequence:
        return True
    if current_run_id != run_id or status in {"done", "failed", "cancelled"}:
        return True
    if status != "pending":
        logger.warning(
            "Rejected execution ignored for non-pending task %d status=%s",
            task_id,
            status,
        )
        return True
    if execution_sequence > last_sequence + 1:
        return False

    new_revision = revision + 1
    failure_progress = processed_items / total_items if total_items > 0 else 0.0
    await session.execute(
        text("""
            UPDATE tasks
            SET status = 'failed',
                processed_items = :processed_items,
                total_items = :total_items,
                progress = :progress,
                stats = :stats::jsonb,
                error = :error,
                last_execution_sequence = :sequence,
                revision = :revision
            WHERE id = :task_id
        """),
        {
            "processed_items": processed_items,
            "total_items": total_items,
            "progress": failure_progress,
            "stats": json.dumps(stats or {}),
            "error": error,
            "sequence": execution_sequence,
            "revision": new_revision,
            "task_id": task_id,
        },
    )
    run_uuid = UUID(run_id)
    await session.execute(
        text("""
            UPDATE task_runs
            SET status = 'failed'
            WHERE id = :run_id
              AND task_id = :task_id
              AND status IN ('requested', 'running')
        """),
        {"run_id": run_uuid, "task_id": task_id},
    )
    await session.execute(
        text("""
            UPDATE task_run_source_demands
            SET status = 'failed'
            WHERE task_run_id = :run_id
              AND status = 'active'
        """),
        {"run_id": run_uuid},
    )

    emit_task_failed(
        session,
        task_id=task_id,
        run_id=run_id,
        owner_user_id=owner_user_id,
        revision=new_revision,
        processed_items=processed_items,
        total_items=total_items,
        error=error,
    )
    emit_task_state_changed(
        session,
        task_id=task_id,
        run_id=run_id,
        status="failed",
        owner_user_id=owner_user_id,
        revision=new_revision,
        processed_items=processed_items,
        total_items=total_items,
        progress=failure_progress,
        stats=stats,
        error=error,
    )
    logger.info(
        "Rejected execution applied for task %d: seq=%d, rev=%d",
        task_id,
        execution_sequence,
        new_revision,
    )
    return True
