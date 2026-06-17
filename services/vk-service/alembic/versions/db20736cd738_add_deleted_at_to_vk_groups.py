"""add deleted_at to vk_groups"""

import sqlalchemy as sa
from alembic import op

revision = "db20736cd738"
down_revision = "6bf15e3dd490"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "vk_groups",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("vk_groups", "deleted_at")
