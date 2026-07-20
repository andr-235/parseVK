"""add im_group_id to monitoring_groups

Revision ID: 20260720_0001
Revises: 20260626_0004
Create Date: 2026-07-20 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260720_0001"
down_revision: str | None = "20260626_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("monitoring_groups", sa.Column("im_group_id", sa.BigInteger(), nullable=True))
    op.create_unique_constraint(
        "uq_monitoring_groups_im_group_id", "monitoring_groups", ["im_group_id"]
    )
    op.create_foreign_key(
        "fk_monitoring_groups_im_group_id",
        "monitoring_groups",
        "im_groups",
        ["im_group_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_monitoring_groups_im_group_id", "monitoring_groups", type_="foreignkey")
    op.drop_constraint("uq_monitoring_groups_im_group_id", "monitoring_groups", type_="unique")
    op.drop_column("monitoring_groups", "im_group_id")
