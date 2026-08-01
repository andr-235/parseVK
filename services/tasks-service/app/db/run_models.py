from datetime import datetime
from uuid import UUID as PyUUID
from uuid import uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.model_utils import utcnow


class TaskRun(Base):
    """Frozen task configuration and source-set snapshot for one execution run."""

    __tablename__ = "task_runs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('requested', 'running', 'completed', 'failed', 'cancelled')",
            name="ck_task_runs_status",
        ),
        CheckConstraint("run_revision >= 0", name="ck_task_runs_run_revision"),
        CheckConstraint("source_set_revision >= 0", name="ck_task_runs_source_set_revision"),
        Index("ix_task_runs_task_created", "task_id", "created_at"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    run_revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="requested")
    source_set_revision: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    snapshot_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    config_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    source_set_snapshot: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class TaskRunSourceDemand(Base):
    __tablename__ = "task_run_source_demands"
    __table_args__ = (
        UniqueConstraint(
            "task_run_id", "source_id",
            name="uq_task_run_source_demands_run_source",
        ),
        CheckConstraint(
            "status IN ('active', 'completed', 'failed', 'cancelled')",
            name="ck_task_run_source_demands_status",
        ),
        Index("ix_task_run_source_demands_run", "task_run_id"),
        Index("ix_task_run_source_demands_source", "source_id"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_run_id: Mapped[PyUUID] = mapped_column(
        ForeignKey("task_runs.id", ondelete="CASCADE"), nullable=False
    )
    source_id: Mapped[PyUUID] = mapped_column(
        ForeignKey("monitoring_sources.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
