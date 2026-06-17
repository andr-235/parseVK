"""add group detail fields (photo, members_count, etc)

Revision ID: 20260530_0003
Revises: a8a5f82b130a
Create Date: 2026-05-30 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260530_0003"
down_revision = "a8a5f82b130a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("content_groups", sa.Column("is_closed", sa.Boolean(), nullable=True))
    op.add_column("content_groups", sa.Column("deactivated", sa.Text(), nullable=True))
    op.add_column("content_groups", sa.Column("type", sa.String(32), nullable=True))
    op.add_column("content_groups", sa.Column("photo_50", sa.Text(), nullable=True))
    op.add_column("content_groups", sa.Column("photo_100", sa.Text(), nullable=True))
    op.add_column("content_groups", sa.Column("photo_200", sa.Text(), nullable=True))
    op.add_column("content_groups", sa.Column("activity", sa.Text(), nullable=True))
    op.add_column("content_groups", sa.Column("age_limits", sa.Integer(), nullable=True))
    op.add_column("content_groups", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("content_groups", sa.Column("members_count", sa.Integer(), nullable=True))
    op.add_column("content_groups", sa.Column("status", sa.Text(), nullable=True))
    op.add_column("content_groups", sa.Column("verified", sa.Integer(), nullable=True))
    op.add_column("content_groups", sa.Column("wall", sa.Integer(), nullable=True))
    op.add_column("content_groups", sa.Column("addresses", postgresql.JSON(), nullable=True))
    op.add_column("content_groups", sa.Column("city", postgresql.JSON(), nullable=True))
    op.add_column("content_groups", sa.Column("counters", postgresql.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("content_groups", "counters")
    op.drop_column("content_groups", "city")
    op.drop_column("content_groups", "addresses")
    op.drop_column("content_groups", "wall")
    op.drop_column("content_groups", "verified")
    op.drop_column("content_groups", "status")
    op.drop_column("content_groups", "members_count")
    op.drop_column("content_groups", "description")
    op.drop_column("content_groups", "age_limits")
    op.drop_column("content_groups", "activity")
    op.drop_column("content_groups", "photo_200")
    op.drop_column("content_groups", "photo_100")
    op.drop_column("content_groups", "photo_50")
    op.drop_column("content_groups", "type")
    op.drop_column("content_groups", "deactivated")
    op.drop_column("content_groups", "is_closed")
