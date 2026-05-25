from datetime import datetime, timezone
from uuid import UUID as PyUUID
from uuid import uuid4

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'running', 'done', 'failed', 'cancelled')", name="ck_tasks_status"),
        CheckConstraint("progress >= 0 AND progress <= 1", name="ck_tasks_progress_range"),
        CheckConstraint("total_items >= 0", name="ck_tasks_total_non_negative"),
        CheckConstraint("processed_items >= 0", name="ck_tasks_processed_non_negative"),
        CheckConstraint("processed_items <= total_items", name="ck_tasks_processed_lte_total"),
        CheckConstraint("post_limit IS NULL OR post_limit BETWEEN 1 AND 100", name="ck_tasks_post_limit_range"),
        CheckConstraint("scope IS NULL OR scope IN ('all', 'selected')", name="ck_tasks_scope"),
        CheckConstraint("mode IS NULL OR mode IN ('recent_posts', 'recheck_group')", name="ck_tasks_mode"),
        CheckConstraint("source IN ('manual', 'automation')", name="ck_tasks_source"),
        Index("ix_tasks_owner_created", "owner_user_id", "created_at", "id"),
        Index("ix_tasks_owner_status", "owner_user_id", "status"),
        Index("ix_tasks_owner_source_status", "owner_user_id", "source", "status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    scope: Mapped[str | None] = mapped_column(String(32), nullable=True)
    mode: Mapped[str | None] = mapped_column(String(64), nullable=True)
    group_ids: Mapped[list[int]] = mapped_column(ARRAY(BigInteger), nullable=False, default=list)
    post_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")
    total_items: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    processed_items: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    progress: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    stats: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    execution_run_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    skipped_groups_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )

    audit_logs: Mapped[list["TaskAuditLog"]] = relationship(back_populates="task")


class TaskAuditLog(Base):
    __tablename__ = "task_audit_logs"
    __table_args__ = (
        Index("ix_task_audit_logs_owner_created", "owner_user_id", "created_at"),
        Index("ix_task_audit_logs_task_created", "task_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    aggregate_type: Mapped[str] = mapped_column(String(128), nullable=False, default="task")
    aggregate_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    task_id: Mapped[int | None] = mapped_column(
        ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True
    )
    event_type: Mapped[str] = mapped_column(String(255), nullable=False)
    event_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    task: Mapped[Task | None] = relationship(back_populates="audit_logs")


class TaskAutomationSettings(Base):
    __tablename__ = "task_automation_settings"
    __table_args__ = (
        UniqueConstraint("owner_user_id", name="uq_task_automation_settings_owner"),
        CheckConstraint("run_hour BETWEEN 0 AND 23", name="ck_task_automation_run_hour"),
        CheckConstraint("run_minute BETWEEN 0 AND 59", name="ck_task_automation_run_minute"),
        CheckConstraint("post_limit BETWEEN 1 AND 100", name="ck_task_automation_post_limit"),
        CheckConstraint(
            "timezone_offset_minutes BETWEEN -720 AND 840",
            name="ck_task_automation_timezone_offset",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    enabled: Mapped[bool] = mapped_column(nullable=False, default=False)
    run_hour: Mapped[int] = mapped_column(Integer, nullable=False, default=9)
    run_minute: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    post_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    timezone_offset_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )


class OutboxEvent(Base):
    __tablename__ = "outbox_events"
    __table_args__ = (
        Index("ix_outbox_events_status_next_attempt", "status", "next_attempt_at"),
        Index("ix_outbox_events_aggregate", "aggregate_type", "aggregate_id"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    event_type: Mapped[str] = mapped_column(String(255), nullable=False)
    event_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    aggregate_type: Mapped[str] = mapped_column(String(128), nullable=False)
    aggregate_id: Mapped[str] = mapped_column(String(128), nullable=False)
    correlation_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    next_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
