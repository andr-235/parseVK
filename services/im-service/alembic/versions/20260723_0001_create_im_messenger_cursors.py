"""create im_messenger_cursors table

Revision ID: 20260723_0001
Revises: 20260722_0001
Create Date: 2026-07-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260723_0001"
down_revision: Union[str, None] = "20260722_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "im_messenger_cursors",
        sa.Column("messenger", sa.String(32), primary_key=True),
        sa.Column("last_poll", sa.BigInteger(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("im_messenger_cursors")
