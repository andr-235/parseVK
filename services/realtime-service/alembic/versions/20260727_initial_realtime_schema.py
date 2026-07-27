"""initial realtime schema

Revision ID: 20260727_initial_realtime_schema
Revises:
Create Date: 2026-07-27
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260727_initial_realtime_schema"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "realtime_events",
        sa.Column("sequence_id", sa.BigInteger, autoincrement=True, primary_key=True),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("event_type", sa.String(128), nullable=False),
        sa.Column("event_version", sa.Integer, nullable=False),
        sa.Column("source_topic", sa.Text, nullable=False),
        sa.Column("source_partition", sa.Integer, nullable=True),
        sa.Column("source_offset", sa.BigInteger, nullable=True),
        sa.Column("audience_type", sa.String(32), nullable=False),
        sa.Column("audience_id", sa.Text, nullable=True),
        sa.Column("aggregate_type", sa.String(64), nullable=True),
        sa.Column("aggregate_id", sa.Text, nullable=True),
        sa.Column("payload", postgresql.JSONB, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_realtime_events_audience_seq",
        "realtime_events",
        ["audience_type", "audience_id", "sequence_id"],
    )
    op.create_index(
        "ix_realtime_events_expires",
        "realtime_events",
        ["expires_at"],
    )


def downgrade() -> None:
    op.drop_table("realtime_events")
