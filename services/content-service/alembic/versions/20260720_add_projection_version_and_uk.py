"""add projection_version and unique constraint to im_messages

Revision ID: 20260720_im_messages_projection
Revises: 20260720_drop_monitoring_groups
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260720_im_messages_projection"
down_revision: str | Sequence[str] | None = "20260720_drop_monitoring_groups"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "im_messages",
        sa.Column("projection_version", sa.Integer(), nullable=False, server_default=sa.text("1")),
    )
    op.create_unique_constraint(
        "uq_im_messages_natural_key",
        "im_messages",
        ["messenger", "external_id", "chat_external_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_im_messages_natural_key", table_name="im_messages")
    op.drop_column("im_messages", "projection_version")
