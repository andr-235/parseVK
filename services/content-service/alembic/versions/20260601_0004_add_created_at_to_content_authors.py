"""add created_at to content authors

Revision ID: 20260601_0004
Revises: 20260530_0003
Create Date: 2026-06-01 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

revision = "20260601_0004"
down_revision = "20260530_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "content_authors",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.alter_column("content_authors", "created_at", server_default=None)


def downgrade() -> None:
    op.drop_column("content_authors", "created_at")
