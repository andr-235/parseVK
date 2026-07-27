"""add vk ingestion checkpoints

Revision ID: pr2a_add_vk_ingestion_checkpoints
Revises: b8d2e3f4a5c6
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "pr2a_add_vk_ingestion_checkpoints"
down_revision: str | None = "b8d2e3f4a5c6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "vk_ingestion_checkpoints",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("task_id", sa.BigInteger(), nullable=False),
        sa.Column("run_id", sa.String(length=128), nullable=False),
        sa.Column("group_id", sa.BigInteger(), nullable=False),
        sa.Column("owner_id", sa.BigInteger(), nullable=False),
        sa.Column("post_id", sa.BigInteger(), nullable=False),
        sa.Column("next_offset", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_comment_id", sa.BigInteger(), nullable=True),
        sa.Column("last_comment_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("processed_comments", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="'in_progress'"),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("run_id", "owner_id", "post_id", name="uq_vk_ingestion_checkpoints_run_owner_post"),
    )


def downgrade() -> None:
    op.drop_table("vk_ingestion_checkpoints")
