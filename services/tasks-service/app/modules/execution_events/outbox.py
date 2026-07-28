"""Canonical outbox event builders for execution event transitions."""

from datetime import UTC, datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import OutboxEvent


def _now() -> datetime:
    return datetime.now(UTC)


def _now_iso() -> str:
    return _now().isoformat()


def _base_outbox(
    event_type: str,
    aggregate_id: str,
    payload: dict,
    dedupe_key: str,
) -> OutboxEvent:
    return OutboxEvent(
        id=uuid4(),
        event_type=event_type,
        event_version=1,
        aggregate_type="task",
        aggregate_id=aggregate_id,
        correlation_id=None,
        dedupe_key=dedupe_key,
        payload=payload,
        status="pending",
        attempts=0,
        next_attempt_at=_now(),
        locked_at=None,
        published_at=None,
        last_error=None,
        created_at=_now(),
    )


def emit_task_state_changed(
    session: AsyncSession,
    *,
    task_id: int,
    run_id: str,
    status: str,
    owner_user_id: str,
    revision: int,
    processed_items: Optional[int] = None,
    total_items: Optional[int] = None,
    progress: Optional[float] = None,
    stats: Optional[dict] = None,
    error: Optional[str] = None,
) -> None:
    """Append a task.state_changed outbox event."""
    payload = {
        "taskId": task_id,
        "runId": run_id,
        "status": status,
        "taskRevision": revision,
        "ownerUserId": owner_user_id,
        "occurredAt": _now_iso(),
    }
    if processed_items is not None:
        payload["processedItems"] = processed_items
    if total_items is not None:
        payload["totalItems"] = total_items
    if progress is not None:
        payload["progress"] = progress
    if stats:
        payload["stats"] = stats
    if error:
        payload["error"] = error

    session.add(
        _base_outbox(
            event_type="task.state_changed",
            aggregate_id=str(task_id),
            payload=payload,
            dedupe_key=f"task.state_changed:{task_id}:{status}:{revision}",
        )
    )


def emit_task_completed(
    session: AsyncSession,
    *,
    task_id: int,
    run_id: str,
    owner_user_id: str,
    revision: int,
    processed_items: int,
    total_items: int,
) -> None:
    """Append a task.completed outbox event."""
    session.add(
        _base_outbox(
            event_type="task.completed",
            aggregate_id=str(task_id),
            payload={
                "taskId": task_id,
                "runId": run_id,
                "processedItems": processed_items,
                "totalItems": total_items,
                "taskRevision": revision,
                "ownerUserId": owner_user_id,
                "occurredAt": _now_iso(),
            },
            dedupe_key=f"task.completed:{task_id}:{run_id}",
        )
    )


def emit_task_failed(
    session: AsyncSession,
    *,
    task_id: int,
    run_id: str,
    owner_user_id: str,
    revision: int,
    processed_items: int,
    total_items: int,
    error: str,
) -> None:
    """Append a task.failed outbox event."""
    session.add(
        _base_outbox(
            event_type="task.failed",
            aggregate_id=str(task_id),
            payload={
                "taskId": task_id,
                "runId": run_id,
                "processedItems": processed_items,
                "totalItems": total_items,
                "error": error,
                "taskRevision": revision,
                "ownerUserId": owner_user_id,
                "occurredAt": _now_iso(),
            },
            dedupe_key=f"task.failed:{task_id}:{run_id}",
        )
    )
