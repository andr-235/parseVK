"""Add last_execution_sequence + processed_events

Revision ID: pr2c1_progress_event_fields
Revises: 20260727_0005
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "pr2c1_progress_event_fields"
down_revision: str | None = "20260727_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column(
            "last_execution_sequence",
            sa.BigInteger(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    op.create_table(
        "processed_events",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.String(length=255), nullable=False),
        sa.Column("consumer_name", sa.String(length=128), nullable=False),
        sa.Column("topic", sa.String(length=128), nullable=False),
        sa.Column("partition", sa.Integer(), nullable=False),
        sa.Column("offset", sa.BigInteger(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id"),
    )
    op.create_index(
        "ix_processed_events_event_id",
        "processed_events",
        ["event_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_processed_events_event_id", table_name="processed_events")
    op.drop_table("processed_events")
    op.drop_column("tasks", "last_execution_sequence")
