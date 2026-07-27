"""Add projection_revision to content_posts

Revision ID: 20260728_0006
Revises: 20260727_content_outbox
Create Date: 2026-07-28

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260728_0006"
down_revision: str | Sequence[str] | None = "20260727_content_outbox"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "content_posts",
        sa.Column(
            "projection_revision",
            sa.BigInteger(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )


def downgrade() -> None:
    op.drop_column("content_posts", "projection_revision")
