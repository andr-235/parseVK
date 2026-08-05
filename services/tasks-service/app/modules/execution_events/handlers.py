"""Domain transition handlers for execution events.

Each handler operates inside an active SQLAlchemy async session and is
responsible for the actual UPDATE/INSERT logic and outbox event creation.
"""

import json
import logging
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.execution_events.outbox import (
    emit_task_completed,
    emit_task_failed,
    emit_task_state_changed,
)
from app.modules.execution_events.task_run_lifecycle import (
    mark_task_run_started,
    mark_task_run_terminal,
)

logger = logging.getLogger(__name__)
TERMINAL_STATUSES = {"done", "failed", "cancelled"}

_LOAD_TASK_SQL = text("""
    SELECT id, status, execution_run_id, last_execution_sequence, revision,
           owner_user_id, processed_items, total_items, progress
    FROM tasks WHERE id = :task_id FOR UPDATE
""")


async def _load_task(session: AsyncSession, task_id: int):
    result = await session.execute(_LOAD_TASK_SQL, {"task_id": task_id})
    return result.one_or_none()


class _SkipEvent(Exception):
    """Raised when an event should be skipped but its offset committed."""


class _SequenceGap(Exception):
    """Raised when a sequence gap is detected; offset must not be committed."""


async def _validate_sequence(
    task_id: int,
    execution_sequence: int,
    task_run_id: str,
    run_id: str,
    last_seq: int,
    status: str,
    *,
    require_running: bool = False,
) -> None:
    if execution_sequence <= last_seq:
        logger.debug(
            "Stale sequence for task %d: %d <= %d",
            task_id,
            execution_sequence,
            last_seq,
        )
        raise _SkipEvent
    if task_run_id != run_id:
        logger.debug("runId mismatch for task %d", task_id)
        raise _SkipEvent
    if status in TERMINAL_STATUSES:
        logger.debug("Task %d is %s, skipping execution event", task_id, status)
        raise _SkipEvent
    if require_running and status != "running":
        logger.debug(
            "Task %d is not running (status=%s), skipping",
            task_id,
            status,
        )
        raise _SkipEvent
    if execution_sequence > last_seq + 1:
        logger.warning(
            "Sequence gap for task %d: %d > %d + 1",
            task_id,
            execution_sequence,
            last_seq,
        )
        raise _SequenceGap


async def apply_started(
    session: AsyncSession,
    task_id: int,
    run_id: str,
    execution_sequence: int,
    owner_user_id: str,
) -> bool:
    row = await _load_task(session, task_id)
    if not row:
        logger.warning("Task %d not found, skipping started", task_id)
        return True

    status = row[1]
    task_run_id = row[2]
    last_seq = row[3] or 0
    revision = row[4] or 0

    try:
        await _validate_sequence(
            task_id,
            execution_sequence,
            task_run_id,
            run_id,
            last_seq,
            status,
        )
    except _SkipEvent:
        return True
    except _SequenceGap:
        return False

    new_revision = revision + 1
    await session.execute(
        text("""
            UPDATE tasks
            SET status = 'running',
                last_execution_sequence = :seq,
                revision = :rev
            WHERE id = :task_id
        """),
        {
            "seq": execution_sequence,
            "rev": new_revision,
            "task_id": task_id,
        },
    )
    await mark_task_run_started(
        session,
        task_id=task_id,
        run_id=run_id,
    )

    if status == "pending":
        emit_task_state_changed(
            session,
            task_id=task_id,
            run_id=run_id,
            status="running",
            owner_user_id=owner_user_id,
            revision=new_revision,
        )

    logger.info(
        "Started applied for task %d: seq=%d, rev=%d",
        task_id,
        execution_sequence,
        new_revision,
    )
    return True


async def apply_progressed(
    session: AsyncSession,
    task_id: int,
    run_id: str,
    execution_sequence: int,
    processed_items: int,
    total_items: int,
    progress: float,
    stats: Optional[dict],
    owner_user_id: str,
) -> bool:
    row = await _load_task(session, task_id)
    if not row:
        return True

    status = row[1]
    task_run_id = row[2]
    last_seq = row[3] or 0
    revision = row[4] or 0

    try:
        await _validate_sequence(
            task_id,
            execution_sequence,
            task_run_id,
            run_id,
            last_seq,
            status,
            require_running=True,
        )
    except _SkipEvent:
        return True
    except _SequenceGap:
        return False

    new_revision = revision + 1
    await session.execute(
        text("""
            UPDATE tasks
            SET processed_items = :processed_items,
                total_items = :total_items,
                progress = :progress,
                stats = :stats::jsonb,
                last_execution_sequence = :sequence,
                revision = :revision
            WHERE id = :task_id
        """),
        {
            "processed_items": processed_items,
            "total_items": total_items,
            "progress": progress,
            "stats": json.dumps(stats or {}),
            "sequence": execution_sequence,
            "revision": new_revision,
            "task_id": task_id,
        },
    )
    emit_task_state_changed(
        session,
        task_id=task_id,
        run_id=run_id,
        status=status,
        owner_user_id=owner_user_id,
        revision=new_revision,
        processed_items=processed_items,
        total_items=total_items,
        progress=progress,
        stats=stats,
    )
    return True


async def apply_completed(
    session: AsyncSession,
    task_id: int,
    run_id: str,
    execution_sequence: int,
    processed_items: int,
    total_items: int,
    stats: Optional[dict],
    owner_user_id: str,
) -> bool:
    row = await _load_task(session, task_id)
    if not row:
        return True

    status = row[1]
    task_run_id = row[2]
    last_seq = row[3] or 0
    revision = row[4] or 0

    try:
        await _validate_sequence(
            task_id,
            execution_sequence,
            task_run_id,
            run_id,
            last_seq,
            status,
            require_running=True,
        )
    except _SkipEvent:
        return True
    except _SequenceGap:
        return False

    new_revision = revision + 1
    await session.execute(
        text("""
            UPDATE tasks
            SET status = 'done',
                processed_items = :processed_items,
                total_items = :total_items,
                progress = 1.0,
                stats = :stats::jsonb,
                last_execution_sequence = :sequence,
                revision = :revision
            WHERE id = :task_id
        """),
        {
            "processed_items": processed_items,
            "total_items": total_items,
            "stats": json.dumps(stats or {}),
            "sequence": execution_sequence,
            "revision": new_revision,
            "task_id": task_id,
        },
    )
    await mark_task_run_terminal(
        session,
        task_id=task_id,
        run_id=run_id,
        status="done",
    )

    emit_task_completed(
        session,
        task_id=task_id,
        run_id=run_id,
        owner_user_id=owner_user_id,
        revision=new_revision,
        processed_items=processed_items,
        total_items=total_items,
    )
    emit_task_state_changed(
        session,
        task_id=task_id,
        run_id=run_id,
        status="done",
        owner_user_id=owner_user_id,
        revision=new_revision,
        processed_items=processed_items,
        total_items=total_items,
        progress=1.0,
        stats=stats,
    )
    logger.info(
        "Completed applied for task %d: seq=%d, rev=%d",
        task_id,
        execution_sequence,
        new_revision,
    )
    return True


async def apply_failed(
    session: AsyncSession,
    task_id: int,
    run_id: str,
    execution_sequence: int,
    processed_items: int,
    total_items: int,
    stats: Optional[dict],
    error: str,
    failure_kind: str,
    owner_user_id: str,
) -> bool:
    row = await _load_task(session, task_id)
    if not row:
        return True

    status = row[1]
    task_run_id = row[2]
    last_seq = row[3] or 0
    revision = row[4] or 0

    try:
        await _validate_sequence(
            task_id,
            execution_sequence,
            task_run_id,
            run_id,
            last_seq,
            status,
            require_running=True,
        )
    except _SkipEvent:
        return True
    except _SequenceGap:
        return False

    new_revision = revision + 1
    failure_progress = (
        processed_items / total_items if total_items > 0 else 0.0
    )
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
    await mark_task_run_terminal(
        session,
        task_id=task_id,
        run_id=run_id,
        status="failed",
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
        "Failed applied for task %d: seq=%d, rev=%d",
        task_id,
        execution_sequence,
        new_revision,
    )
    return True
