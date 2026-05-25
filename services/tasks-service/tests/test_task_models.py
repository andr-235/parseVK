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


def test_task_has_owner_source_and_status_columns():
    columns = Task.__table__.columns
    assert "owner_user_id" in columns
    assert "source" in columns
    assert "status" in columns
    assert "completed" not in columns
