from datetime import datetime
from uuid import UUID as PyUUID
from uuid import uuid4

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.model_utils import utcnow


class MonitoringSource(Base):
    __tablename__ = "monitoring_sources"
    __table_args__ = (
        UniqueConstraint(
            "provider", "source_type", "external_id",
            name="uq_monitoring_sources_identity",
        ),
        CheckConstraint("owner_id < 0", name="ck_monitoring_sources_owner_negative"),
        CheckConstraint("revision >= 0", name="ck_monitoring_sources_revision"),
        CheckConstraint(
            "status IN ('active', 'inactive')",
            name="ck_monitoring_sources_status",
        ),
    )

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    external_id: Mapped[str] = mapped_column(String(64), nullable=False)
    owner_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="active"
    )
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow,
        onupdate=utcnow,
    )


class TaskSource(Base):
    __tablename__ = "task_sources"
    __table_args__ = (
        UniqueConstraint(
            "task_id", "source_id", name="uq_task_sources_task_source"
        ),
        CheckConstraint(
            "kind IN ('target', 'reference')",
            name="ck_task_sources_kind",
        ),
        CheckConstraint("revision >= 0", name="ck_task_sources_revision"),
    )

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    source_id: Mapped[PyUUID] = mapped_column(
        ForeignKey("monitoring_sources.id", ondelete="CASCADE"),
        nullable=False,
    )
    kind: Mapped[str] = mapped_column(
        String(32), nullable=False, default="target"
    )
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )


class AccessScope(Base):
    __tablename__ = "access_scopes"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )


class ScopeSourceAccess(Base):
    __tablename__ = "scope_source_access"
    __table_args__ = (
        UniqueConstraint(
            "access_scope_id", "source_id",
            name="uq_scope_source_access_scope_source",
        ),
        CheckConstraint(
            "ref_count >= 0", name="ck_scope_source_access_ref_count"
        ),
        Index("ix_scope_source_access_source", "source_id"),
        Index("ix_scope_source_access_scope", "access_scope_id"),
    )

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    access_scope_id: Mapped[PyUUID] = mapped_column(
        ForeignKey("access_scopes.id", ondelete="CASCADE"), nullable=False
    )
    source_id: Mapped[PyUUID] = mapped_column(
        ForeignKey("monitoring_sources.id", ondelete="CASCADE"),
        nullable=False,
    )
    ref_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    revoked_by: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
