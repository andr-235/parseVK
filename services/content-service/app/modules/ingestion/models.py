from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ContentIngestionReceipt(Base):
    __tablename__ = "content_ingestion_receipts"
    __table_args__ = (
        UniqueConstraint(
            "source_service",
            "source_message_id",
            name="uq_content_ingestion_receipt_source_message",
        ),
        UniqueConstraint(
            "source_service",
            "batch_id",
            "part_kind",
            "part_index",
            name="uq_content_ingestion_receipt_batch_part",
        ),
        CheckConstraint("part_count > 0", name="ck_content_ingestion_receipt_part_count"),
        CheckConstraint(
            "part_index >= 0 AND part_index < part_count",
            name="ck_content_ingestion_receipt_part_index",
        ),
        CheckConstraint(
            "staging_schema > 0 AND packing_version > 0 AND event_contract > 0",
            name="ck_content_ingestion_receipt_versions",
        ),
    )

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True)
    source_service: Mapped[str] = mapped_column(String(64), nullable=False)
    source_message_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    batch_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False)
    part_kind: Mapped[str] = mapped_column(String(16), nullable=False)
    part_index: Mapped[int] = mapped_column(Integer, nullable=False)
    part_count: Mapped[int] = mapped_column(Integer, nullable=False)
    staging_schema: Mapped[int] = mapped_column(Integer, nullable=False)
    packing_version: Mapped[int] = mapped_column(Integer, nullable=False)
    event_contract: Mapped[int] = mapped_column(Integer, nullable=False)
    source_position: Mapped[dict] = mapped_column(JSONB, nullable=False)
    page_digest: Mapped[str] = mapped_column(String(64), nullable=False)
    part_digest: Mapped[str] = mapped_column(String(64), nullable=False)
    wire_digest: Mapped[str] = mapped_column(String(64), nullable=False)
    wire_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    effect_summary: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    ack_event_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), nullable=False, unique=True)
    correlation_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
