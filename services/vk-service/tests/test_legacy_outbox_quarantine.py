from datetime import UTC, datetime
from pathlib import Path
from runpy import run_path
from uuid import uuid4

import pytest

from app.infrastructure.db.models.outbox import OutboxEvent

MODULE_PATH = (
    Path(__file__).resolve().parents[1]
    / "alembic/versions/pr6b2_quarantine_legacy_outbox.py"
)


def load_migration() -> dict:
    return run_path(str(MODULE_PATH))


def make_event(event_type: str, *, status: str = "pending") -> OutboxEvent:
    now = datetime.now(UTC)
    return OutboxEvent(
        id=uuid4(),
        event_type=event_type,
        aggregate_type="task",
        aggregate_id="42",
        payload={"taskId": 42},
        status=status,
        attempts=0,
        next_attempt_at=now,
        locked_at=now if status == "pending" else None,
        published_at=now if status == "published" else None,
        created_at=now,
    )


@pytest.mark.anyio
async def test_quarantine_blocks_only_pending_legacy_lifecycle_events(db_session):
    migration = load_migration()
    legacy_types = (
        "task.execution_started",
        "task.execution_progressed",
        "task.execution_completed",
        "task.execution_failed",
    )
    pending_legacy = [make_event(event_type) for event_type in legacy_types]
    published_legacy = make_event("task.execution_completed", status="published")
    pending_canonical_command = make_event("vk.execution.requested")
    db_session.add_all(
        [*pending_legacy, published_legacy, pending_canonical_command]
    )
    await db_session.flush()

    await db_session.execute(migration["quarantine_statement"]())
    for event in [*pending_legacy, published_legacy, pending_canonical_command]:
        await db_session.refresh(event)

    for event in pending_legacy:
        assert event.status == "failed"
        assert event.locked_at is None
        assert event.last_error == migration["_QUARANTINE_ERROR"]

    assert published_legacy.status == "published"
    assert published_legacy.last_error is None
    assert pending_canonical_command.status == "pending"
    assert pending_canonical_command.last_error is None


def test_quarantine_follows_source_level_cutover_revision():
    migration = load_migration()

    assert migration["revision"] == "pr6b2_quarantine_legacy_outbox"
    assert migration["down_revision"] == "pr6b_source_collection_identity"
