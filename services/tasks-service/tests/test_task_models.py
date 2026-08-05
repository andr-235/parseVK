import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.db.models import OutboxEvent, Task, TaskAuditLog, TaskAutomationSettings


def test_model_tables_exist():
    assert Task.__tablename__ == "tasks"
    assert TaskAuditLog.__tablename__ == "task_audit_logs"
    assert TaskAutomationSettings.__tablename__ == "task_automation_settings"
    assert OutboxEvent.__tablename__ == "outbox_events"


def test_task_has_owner_source_status_and_revision_columns():
    columns = Task.__table__.columns
    assert "owner_user_id" in columns
    assert "source" in columns
    assert "status" in columns
    assert "revision" in columns
    assert "source_set_revision" in columns
    assert columns["source_set_revision"].nullable is False
    assert "completed" not in columns


def test_source_set_revision_has_database_constraint():
    names = {
        constraint.name
        for constraint in Task.__table__.constraints
        if constraint.name
    }
    assert "ck_tasks_source_set_revision" in names
