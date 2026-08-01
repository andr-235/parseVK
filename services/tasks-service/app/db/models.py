from datetime import UTC, datetime
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
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


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
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_execution_sequence: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
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


class MonitoringSource(Base):
    """Normalized global source identity, unique by provider/type/external ID.

    ``owner_id`` follows the NegativeOwnerId pattern: for VK communities it is
    ``-external_id`` (mirrors the ``SourceReference`` contract validator).
    """

    __tablename__ = "monitoring_sources"
    __table_args__ = (
        UniqueConstraint(
            "provider", "source_type", "external_id",
            name="uq_monitoring_sources_identity",
        ),
        CheckConstraint("owner_id < 0", name="ck_monitoring_sources_owner_negative"),
        CheckConstraint("revision >= 0", name="ck_monitoring_sources_revision"),
        CheckConstraint("status IN ('active', 'inactive')", name="ck_monitoring_sources_status"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    external_id: Mapped[str] = mapped_column(String(64), nullable=False)
    owner_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )


class TaskSource(Base):
    """Attachment of a source to a task. Unique by (task_id, source_id)."""

    __tablename__ = "task_sources"
    __table_args__ = (
        UniqueConstraint("task_id", "source_id", name="uq_task_sources_task_source"),
        CheckConstraint("kind IN ('target', 'reference')", name="ck_task_sources_kind"),
        CheckConstraint("revision >= 0", name="ck_task_sources_revision"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    source_id: Mapped[PyUUID] = mapped_column(
        ForeignKey("monitoring_sources.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[str] = mapped_column(String(32), nullable=False, default="target")
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class AccessScope(Base):
    """User-owned access scope grouping sources.

    ``created_by_user_id`` is a SEPARATE column from the scope id —
    never conflate who created the scope with the scope identity.
    """

    __tablename__ = "access_scopes"

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class ScopeSourceAccess(Base):
    """Effective scope/source access with reference counting and tombstones.

    Revoke marks a tombstone (revoked_at/revoked_by) instead of hard delete;
    ref_count tracks how many tasks still reference the access.
    """

    __tablename__ = "scope_source_access"
    __table_args__ = (
        UniqueConstraint(
            "access_scope_id", "source_id",
            name="uq_scope_source_access_scope_source",
        ),
        CheckConstraint("ref_count >= 0", name="ck_scope_source_access_ref_count"),
        Index("ix_scope_source_access_source", "source_id"),
        Index("ix_scope_source_access_scope", "access_scope_id"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    access_scope_id: Mapped[PyUUID] = mapped_column(
        ForeignKey("access_scopes.id", ondelete="CASCADE"), nullable=False
    )
    source_id: Mapped[PyUUID] = mapped_column(
        ForeignKey("monitoring_sources.id", ondelete="CASCADE"), nullable=False
    )
    ref_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_by: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


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
        Index(
            "uq_outbox_events_dedupe_key",
            "dedupe_key",
            unique=True,
            postgresql_where=text("dedupe_key IS NOT NULL"),
        ),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    event_type: Mapped[str] = mapped_column(String(255), nullable=False)
    event_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    aggregate_type: Mapped[str] = mapped_column(String(128), nullable=False)
    aggregate_id: Mapped[str] = mapped_column(String(128), nullable=False)
    correlation_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    dedupe_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    next_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class ProcessedEvent(Base):
    __tablename__ = "processed_events"
    __table_args__ = (
        Index("ix_processed_events_event_id", "event_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    consumer_name: Mapped[str] = mapped_column(String(128), nullable=False)
    topic: Mapped[str] = mapped_column(String(128), nullable=False)
    partition: Mapped[int] = mapped_column(Integer, nullable=False)
    offset: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
