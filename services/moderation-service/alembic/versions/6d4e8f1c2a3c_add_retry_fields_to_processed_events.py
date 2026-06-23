"""add retry fields to processed_events

Revision ID: 6d4e8f1c2a3c
Revises: 6d4e8f1c2a3b
Create Date: 2026-06-23 01:50:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "6d4e8f1c2a3c"
down_revision: str | None = "6d4e8f1c2a3b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("processed_events", sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("processed_events", sa.Column("last_error", sa.Text(), nullable=True))
    op.add_column("processed_events", sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=True))
    op.alter_column("processed_events", "retry_count", server_default=None)


def downgrade() -> None:
    op.drop_column("processed_events", "next_retry_at")
    op.drop_column("processed_events", "last_error")
    op.drop_column("processed_events", "retry_count")
