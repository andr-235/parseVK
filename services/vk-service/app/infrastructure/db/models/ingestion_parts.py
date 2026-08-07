from datetime import UTC, datetime
from uuid import UUID as PyUUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class VkIngestionStagingPart(Base):
    __tablename__ = "vk_ingestion_staging_parts"
    __table_args__ = (
        UniqueConstraint(
            "batch_id",
            "part_kind",
            "staging_schema_version",
            "packing_version",
            "event_contract_version",
            "part_index",
            name="uq_vk_ingestion_part_identity",
        ),
        CheckConstraint(
            "part_kind IN ('post', 'comments')",
            name="ck_vk_ingestion_part_kind",
        ),
        CheckConstraint(
            "part_count > 0 AND part_index >= 0 AND part_index < part_count",
            name="ck_vk_ingestion_part_position",
        ),
        CheckConstraint(
            "staging_schema_version > 0 AND packing_version > 0 "
            "AND event_contract_version > 0",
            name="ck_vk_ingestion_part_versions",
        ),
        CheckConstraint(
            "wire_bytes_count > 0 AND wire_bytes_count <= 786432",
            name="ck_vk_ingestion_part_wire_bytes",
        ),
        CheckConstraint(
            "status IN ('prepared', 'published', 'failed', 'quarantined')",
            name="ck_vk_ingestion_part_status",
        ),
        Index("ix_vk_ingestion_parts_batch", "batch_id", "part_index"),
        Index("ix_vk_ingestion_parts_status", "status", "prepared_at"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    batch_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vk_ingestion_staging_batches.id", ondelete="RESTRICT"),
        nullable=False,
    )
    part_kind: Mapped[str] = mapped_column(String(16), nullable=False)
    part_index: Mapped[int] = mapped_column(Integer, nullable=False)
    part_count: Mapped[int] = mapped_column(Integer, nullable=False)
    staging_schema_version: Mapped[int] = mapped_column(Integer, nullable=False)
    packing_version: Mapped[int] = mapped_column(Integer, nullable=False)
    event_contract_version: Mapped[int] = mapped_column(Integer, nullable=False)
    item_manifest: Mapped[list] = mapped_column(JSONB, nullable=False)
    author_manifest: Mapped[list] = mapped_column(JSONB, nullable=False)
    prepared_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    part_digest: Mapped[str] = mapped_column(String(64), nullable=False)
    wire_bytes: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    wire_bytes_count: Mapped[int] = mapped_column(Integer, nullable=False)
    wire_digest: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="prepared",
        server_default=text("'prepared'"),
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


from app.infrastructure.db.models.ingestion_part_publication import (  # noqa: E402, F401
    VkIngestionPartReference,
)
