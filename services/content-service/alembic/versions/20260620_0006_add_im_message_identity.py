"""add stable IM message identity

Revision ID: 20260620_0006
Revises: 30edcb443fca
"""

import sqlalchemy as sa
from alembic import op

revision = "20260620_0006"
down_revision = "30edcb443fca"
branch_labels = None
depends_on = None


def upgrade() -> None:
    messages = sa.table(
        "im_messages",
        sa.column("messenger", sa.String),
        sa.column("chat_external_id", sa.String),
        sa.column("external_id", sa.String),
    )
    duplicate = op.get_bind().execute(
        sa.select(
            messages.c.messenger,
            messages.c.chat_external_id,
            messages.c.external_id,
        )
        .group_by(
            messages.c.messenger,
            messages.c.chat_external_id,
            messages.c.external_id,
        )
        .having(sa.func.count() > 1)
        .limit(1)
    ).first()
    if duplicate:
        raise RuntimeError("Duplicate IM message identities must be resolved before upgrade")
    op.create_unique_constraint(
        "uq_im_messages_identity",
        "im_messages",
        ["messenger", "chat_external_id", "external_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_im_messages_identity",
        "im_messages",
        type_="unique",
    )
