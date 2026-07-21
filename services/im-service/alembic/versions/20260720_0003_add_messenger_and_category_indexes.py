"""add messenger and category indexes to monitoring_groups

Revision ID: 20260720_0003
Revises: 20260720_0002
Create Date: 2026-07-20 00:00:00.000000

"""
from collections.abc import Sequence

from alembic import op

revision: str = "20260720_0003"
down_revision: str | None = "20260720_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index("ix_monitoring_groups_messenger", "monitoring_groups", ["messenger"], unique=False)
    op.create_index("ix_monitoring_groups_category", "monitoring_groups", ["category"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_monitoring_groups_messenger", table_name="monitoring_groups")
    op.drop_index("ix_monitoring_groups_category", table_name="monitoring_groups")
