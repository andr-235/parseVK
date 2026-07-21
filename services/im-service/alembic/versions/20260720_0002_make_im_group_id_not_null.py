"""make im_group_id not null

Revision ID: 20260720_0002
Revises: 20260720_0001
Create Date: 2026-07-20 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260720_0002"
down_revision: str | None = "20260720_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT COUNT(*) FROM monitoring_groups WHERE im_group_id IS NULL")
    )
    if result is not None:
        null_count = result.scalar()
        if null_count and null_count > 0:
            raise Exception(
                f"Cannot SET NOT NULL: {null_count} rows have NULL im_group_id. "
                "Run backfill script first."
            )

    op.alter_column("monitoring_groups", "im_group_id", nullable=False)


def downgrade() -> None:
    op.alter_column("monitoring_groups", "im_group_id", nullable=True)
