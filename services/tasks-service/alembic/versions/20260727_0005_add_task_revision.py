"""Add revision column to tasks table"""

import sqlalchemy as sa
from alembic import op

revision = "20260727_0005"
down_revision = "20260623_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("revision", sa.Integer(), nullable=False, server_default=sa.text("0")))


def downgrade() -> None:
    op.drop_column("tasks", "revision")
