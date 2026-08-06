from datetime import UTC, datetime
from uuid import UUID as PyUUID

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class VkIngestionStagingBatch(Base):
    __tablename__ = "vk_ingestion_staging_batches"
    __table_args__ = (
        UniqueConstraint(
            "execution_id",
            "source_kind",
            "owner_id",
            "post_id",
            "page_offset",
            name="uq_vk_ingestion_staging_position",
        ),
        CheckConstraint("page_offset >= 0", name="ck_vk_ingestion_staging_page_offset"),
        CheckConstraint("payload_bytes >= 2", name="ck_vk_ingestion_staging_payload_bytes"),
        CheckConstraint(
            "status IN ('staged', 'persisted', 'failed')",
            name="ck_vk_ingestion_staging_status",
        ),
        Index("ix_vk_ingestion_staging_status", "status", "created_at"),
        Index("ix_vk_ingestion_staging_execution", "execution_id", "page_offset"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    execution_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vk_executions.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Attempt identity is immutable provenance, not lifecycle ownership. Keeping
    # the UUID without an FK lets durable recovery data outlive attempt cleanup.
    staged_by_attempt_id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    staged_by_fencing_token: Mapped[int] = mapped_column(BigInteger, nullable=False)
    source_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    owner_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    post_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    page_offset: Mapped[int] = mapped_column(Integer, nullable=False)
    payload_digest: Mapped[str] = mapped_column(String(64), nullable=False)
    payload_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="staged", server_default=text("'staged'")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow,
        onupdate=utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
    )
