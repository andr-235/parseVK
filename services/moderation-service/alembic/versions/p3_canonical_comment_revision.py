"""add canonical moderation projection revisions

Revision ID: p3_canonical_comment_revision
Revises: pr5_consumer_name_moderation
Create Date: 2026-08-09 20:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "p3_canonical_comment_revision"
down_revision: str | None = "pr5_consumer_name_moderation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "moderation_canonical_comment_revisions",
        sa.Column("external_key", sa.Text(), nullable=False),
        sa.Column("post_revision", sa.BigInteger(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("external_key"),
    )


def downgrade() -> None:
    op.drop_table("moderation_canonical_comment_revisions")
