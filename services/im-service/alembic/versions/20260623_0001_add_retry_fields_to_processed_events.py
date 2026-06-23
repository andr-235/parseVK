"""add retry fields to processed_events

Revision ID: 20260623_0001
Revises: 20260608_0001
Create Date: 2026-06-23 01:50:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = "20260623_0001"
down_revision = "20260608_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("processed_events", sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("processed_events", sa.Column("last_error", sa.Text(), nullable=True))
    op.add_column("processed_events", sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=True))
    op.alter_column("processed_events", "retry_count", server_default=None)


def downgrade() -> None:
    op.drop_column("processed_events", "next_retry_at")
    op.drop_column("processed_events", "last_error")
    op.drop_column("processed_events", "retry_count")
