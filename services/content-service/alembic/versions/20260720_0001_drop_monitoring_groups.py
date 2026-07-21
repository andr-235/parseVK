"""drop monitoring_groups table

Revision ID: 20260720_0001_drop_monitoring_groups
Revises: f7c1b2d3e4a5
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260720_0001_drop_monitoring_groups"
down_revision: str | Sequence[str] | None = "f7c1b2d3e4a5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_monitoring_groups_messenger", table_name="monitoring_groups")
    op.drop_index("ix_monitoring_groups_category", table_name="monitoring_groups")
    op.drop_table("monitoring_groups")


def downgrade() -> None:
    op.create_table(
        "monitoring_groups",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("messenger", sa.String(length=32), nullable=False),
        sa.Column("chat_id", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("category", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("messenger", "chat_id", name="uq_monitoring_groups_messenger_chat"),
    )
    op.create_index("ix_monitoring_groups_category", "monitoring_groups", ["category"], unique=False)
    op.create_index("ix_monitoring_groups_messenger", "monitoring_groups", ["messenger"], unique=False)
