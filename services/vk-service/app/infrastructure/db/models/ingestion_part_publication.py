from datetime import UTC, datetime
from uuid import UUID as PyUUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class VkIngestionPartReference(Base):
    __tablename__ = "vk_ingestion_part_references"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'published', 'applied', 'failed', 'quarantined')",
            name="ck_vk_ingestion_part_reference_status",
        ),
        CheckConstraint("attempts >= 0", name="ck_vk_ingestion_part_reference_attempts"),
        CheckConstraint(
            "(claim_id IS NULL AND claimed_by IS NULL AND claim_expires_at IS NULL) "
            "OR (claim_id IS NOT NULL AND claimed_by IS NOT NULL AND claim_expires_at IS NOT NULL)",
            name="ck_vk_ingestion_part_reference_claim_complete",
        ),
        CheckConstraint(
            "status = 'pending' OR claim_id IS NULL",
            name="ck_vk_ingestion_part_reference_terminal_unclaimed",
        ),
        UniqueConstraint("ack_event_id", name="uq_vk_ingestion_part_reference_ack_event"),
        UniqueConstraint("ack_receipt_id", name="uq_vk_ingestion_part_reference_ack_receipt"),
        Index("ix_vk_ingestion_part_references_due", "status", "next_attempt_at", "created_at"),
        Index("ix_vk_ingestion_part_references_claim_expiry", "claim_expires_at"),
    )

    part_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vk_ingestion_staging_parts.id", ondelete="RESTRICT"),
        primary_key=True,
    )
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pending", server_default=text("'pending'")
    )
    claim_id: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True))
    claimed_by: Mapped[str | None] = mapped_column(String(128))
    claim_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"))
    next_attempt_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, server_default=text("CURRENT_TIMESTAMP")
    )
    last_error: Mapped[str | None] = mapped_column(String(2000))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    quarantined_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ack_event_id: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True))
    ack_receipt_id: Mapped[PyUUID | None] = mapped_column(UUID(as_uuid=True))
    ack_applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ack_received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ack_source_position: Mapped[dict | None] = mapped_column(JSONB)
    ack_effect_summary: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow,
        server_default=text("CURRENT_TIMESTAMP")
    )
