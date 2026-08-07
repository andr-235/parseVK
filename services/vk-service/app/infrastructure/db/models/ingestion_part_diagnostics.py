from datetime import UTC, datetime
from uuid import UUID as PyUUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class VkIngestionOversizedDiagnostic(Base):
    __tablename__ = "vk_ingestion_oversized_diagnostics"
    __table_args__ = (
        UniqueConstraint(
            "batch_id",
            "item_kind",
            "item_identity",
            "staging_schema_version",
            "packing_version",
            "event_contract_version",
            name="uq_vk_ingestion_oversized_identity",
        ),
        CheckConstraint(
            "item_kind IN ('post', 'comment')",
            name="ck_vk_ingestion_oversized_item_kind",
        ),
        CheckConstraint(
            "wire_bytes_count > hard_limit_bytes AND hard_limit_bytes > 0",
            name="ck_vk_ingestion_oversized_bytes",
        ),
        CheckConstraint(
            "status = 'quarantined'",
            name="ck_vk_ingestion_oversized_status",
        ),
        Index("ix_vk_ingestion_oversized_batch", "batch_id", "created_at"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    batch_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vk_ingestion_staging_batches.id", ondelete="RESTRICT"),
        nullable=False,
    )
    item_kind: Mapped[str] = mapped_column(String(16), nullable=False)
    item_identity: Mapped[str] = mapped_column(String(128), nullable=False)
    staging_schema_version: Mapped[int] = mapped_column(Integer, nullable=False)
    packing_version: Mapped[int] = mapped_column(Integer, nullable=False)
    event_contract_version: Mapped[int] = mapped_column(Integer, nullable=False)
    wire_bytes_count: Mapped[int] = mapped_column(Integer, nullable=False)
    hard_limit_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="quarantined",
        server_default=text("'quarantined'")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow,
        server_default=text("CURRENT_TIMESTAMP")
    )
