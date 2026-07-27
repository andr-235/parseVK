"""add content_outbox_events table

Revision ID: 20260727_content_outbox
Revises: 20260724_add_pg_trgm_index
Create Date: 2026-07-27

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260727_content_outbox"
down_revision: str | Sequence[str] | None = "20260724_add_pg_trgm_index"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "content_outbox_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("event_type", sa.String(128), nullable=False),
        sa.Column("event_version", sa.Integer, nullable=False, server_default=sa.text("1")),
        sa.Column("aggregate_type", sa.String(64), nullable=False),
        sa.Column("aggregate_id", sa.Text, nullable=False),
        sa.Column("correlation_id", sa.Text, nullable=True),
        sa.Column("dedupe_key", sa.Text, nullable=True, unique=True),
        sa.Column("payload", postgresql.JSONB, nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("attempts", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("last_error", sa.Text, nullable=True),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_content_outbox_events_status_next", "content_outbox_events", ["status", "next_attempt_at"])


def downgrade() -> None:
    op.drop_table("content_outbox_events")
