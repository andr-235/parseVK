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
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class VkSourceCollection(Base):
    __tablename__ = "vk_source_collections"
    __table_args__ = (
        UniqueConstraint("execution_id", name="uq_vk_source_collections_execution"),
        Index("ix_vk_source_collections_execution", "execution_id"),
        Index("ix_vk_source_collections_status", "status", "created_at"),
        Index("ix_vk_source_collections_source", "source_id", "created_at"),
        Index(
            "uq_vk_source_collections_active_fingerprint",
            "identity_version",
            "provider_account_key",
            "source_key",
            "fingerprint",
            unique=True,
            postgresql_where=text("status IN ('pending', 'running')"),
            sqlite_where=text("status IN ('pending', 'running')"),
        ),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    execution_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vk_executions.id", ondelete="CASCADE"),
        nullable=False,
    )
    identity_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    provider_account_key: Mapped[str] = mapped_column(String(128), nullable=False)
    source_key: Mapped[str] = mapped_column(String(512), nullable=False)
    source_id: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    source_provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    source_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_external_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    source_owner_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    fingerprint: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    plan_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )


class VkCollectionDemand(Base):
    __tablename__ = "vk_collection_demands"
    __table_args__ = (
        UniqueConstraint("demand_id", name="uq_vk_collection_demands_demand_id"),
        UniqueConstraint(
            "task_id",
            "run_id",
            "source_id",
            name="uq_vk_collection_demands_task_run_source",
        ),
        Index("ix_vk_collection_demands_collection", "collection_id", "status"),
        Index("ix_vk_collection_demands_task", "task_id", "created_at"),
        Index(
            "ix_vk_collection_demands_task_run_status",
            "task_id",
            "run_id",
            "status",
        ),
        Index("ix_vk_collection_demands_source", "source_id", "created_at"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    demand_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, default=uuid4
    )
    collection_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vk_source_collections.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_id: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    task_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    run_id: Mapped[str] = mapped_column(String(128), nullable=False)
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    task_revision: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_set_revision: Mapped[int | None] = mapped_column(Integer, nullable=True)
    snapshot_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    execution_sequence: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    cancellation_requested_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
