from datetime import UTC, datetime
from uuid import UUID as PyUUID
from uuid import uuid4

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class VkExecution(Base):
    __tablename__ = "vk_executions"
    __table_args__ = (
        UniqueConstraint("task_id", "run_id", name="uq_vk_executions_task_run"),
        Index("ix_vk_executions_claimable", "status", "available_at"),
        Index("ix_vk_executions_task_id", "task_id"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    run_id: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    scope: Mapped[str] = mapped_column(String(32), nullable=False)
    mode: Mapped[str] = mapped_column(String(64), nullable=False)
    group_ids: Mapped[list[int]] = mapped_column(ARRAY(BigInteger), nullable=False, default=list)
    post_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    plan_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    processed_items: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_items: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    # The database migration adds the FK after both tables exist. The ORM keeps
    # this as a plain UUID to avoid a circular metadata dependency in SQLite tests.
    current_attempt_id: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    current_fencing_token: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    cancellation_requested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_execution_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vk_executions.id", ondelete="SET NULL"), nullable=True
    )
    execution_sequence: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )


class VkExecutionAttempt(Base):
    __tablename__ = "vk_execution_attempts"
    __table_args__ = (
        UniqueConstraint("execution_id", "attempt_number", name="uq_vk_execution_attempt_number"),
        UniqueConstraint("execution_id", "fencing_token", name="uq_vk_execution_fencing_token"),
        Index("ix_vk_execution_attempts_lease", "status", "lease_expires_at"),
        Index(
            "uq_vk_execution_attempts_running",
            "execution_id",
            unique=True,
            postgresql_where=text("status = 'running'"),
            sqlite_where=text("status = 'running'"),
        ),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    execution_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vk_executions.id", ondelete="CASCADE"), nullable=False
    )
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    fencing_token: Mapped[int] = mapped_column(BigInteger, nullable=False)
    worker_id: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="running")
    provider_account_key: Mapped[str] = mapped_column(String(128), nullable=False)
    credential_version: Mapped[str] = mapped_column(String(64), nullable=False)
    lease_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    heartbeat_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
