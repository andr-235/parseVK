"""create im_messages table for IM events

Revision ID: 20260608_0005
Revises: 20260601_0004
Create Date: 2026-06-08 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "20260608_0005"
down_revision = "20260601_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "im_messages",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("messenger", sa.String(32), nullable=False),
        sa.Column("external_id", sa.String(256), nullable=False),
        sa.Column("chat_external_id", sa.String(256), nullable=False),
        sa.Column("chat_name", sa.Text(), nullable=True),
        sa.Column("author", sa.Text(), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("content_url", sa.Text(), nullable=True),
        sa.Column("content_type", sa.String(128), nullable=True),
        sa.Column("metadata_raw", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ingested_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_im_messages_messenger_created", "im_messages", ["messenger", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_im_messages_messenger_created", table_name="im_messages")
    op.drop_table("im_messages")
