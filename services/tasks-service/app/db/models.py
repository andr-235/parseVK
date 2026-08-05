"""Compatibility re-exports for tasks-service SQLAlchemy models.

Model implementations live in small aggregate-focused modules. Existing
imports from ``app.db.models`` remain stable for services, tests, and Alembic.
"""

from app.db.infra_models import OutboxEvent, ProcessedEvent, TaskAutomationSettings
from app.db.model_utils import utcnow
from app.db.run_models import TaskRun, TaskRunSourceDemand
from app.db.source_models import (
    AccessScope,
    MonitoringSource,
    ScopeSourceAccess,
    SourceRegistration,
    TaskSource,
)
from app.db.task_models import Task, TaskAuditLog

__all__ = [
    "AccessScope",
    "MonitoringSource",
    "OutboxEvent",
    "ProcessedEvent",
    "ScopeSourceAccess",
    "SourceRegistration",
    "Task",
    "TaskAuditLog",
    "TaskAutomationSettings",
    "TaskRun",
    "TaskRunSourceDemand",
    "TaskSource",
    "utcnow",
]
