"""add enabled and scopes columns to keywords

Revision ID: 6d4e8f1c2a3d
Revises: 6d4e8f1c2a3c
Create Date: 2026-06-26 12:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "6d4e8f1c2a3d"
down_revision: str | None = "6d4e8f1c2a3c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("keywords", sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"))
    op.add_column("keywords", sa.Column("scopes", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='["moderation", "im-monitoring"]'))


def downgrade() -> None:
    op.drop_column("keywords", "scopes")
    op.drop_column("keywords", "enabled")
