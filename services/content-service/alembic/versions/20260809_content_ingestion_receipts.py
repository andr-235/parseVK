"""add durable content ingestion receipts

Revision ID: 20260809_content_ingestion_receipts
Revises: 20260728_0006
Create Date: 2026-08-09
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260809_content_ingestion_receipts"
down_revision: str | Sequence[str] | None = "20260728_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "content_ingestion_receipts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("source_service", sa.String(64), nullable=False),
        sa.Column("source_message_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("part_kind", sa.String(16), nullable=False),
        sa.Column("part_index", sa.Integer(), nullable=False),
        sa.Column("part_count", sa.Integer(), nullable=False),
        sa.Column("staging_schema", sa.Integer(), nullable=False),
        sa.Column("packing_version", sa.Integer(), nullable=False),
        sa.Column("event_contract", sa.Integer(), nullable=False),
        sa.Column("source_position", postgresql.JSONB(), nullable=False),
        sa.Column("page_digest", sa.String(64), nullable=False),
        sa.Column("part_digest", sa.String(64), nullable=False),
        sa.Column("wire_digest", sa.String(64), nullable=False),
        sa.Column("wire_bytes", sa.Integer(), nullable=False),
        sa.Column("effect_summary", postgresql.JSONB(), nullable=False),
        sa.Column("ack_event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("part_count > 0", name="ck_content_ingestion_receipt_part_count"),
        sa.CheckConstraint(
            "part_index >= 0 AND part_index < part_count",
            name="ck_content_ingestion_receipt_part_index",
        ),
        sa.CheckConstraint(
            "staging_schema > 0 AND packing_version > 0 AND event_contract > 0",
            name="ck_content_ingestion_receipt_versions",
        ),
        sa.UniqueConstraint(
            "source_service",
            "source_message_id",
            name="uq_content_ingestion_receipt_source_message",
        ),
        sa.UniqueConstraint(
            "source_service",
            "batch_id",
            "part_kind",
            "part_index",
            name="uq_content_ingestion_receipt_batch_part",
        ),
        sa.UniqueConstraint("ack_event_id", name="uq_content_ingestion_receipts_ack_event_id"),
    )


def downgrade() -> None:
    op.drop_table("content_ingestion_receipts")
