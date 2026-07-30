"""normalize Telegram job statuses

Revision ID: 20260731_0002
Revises: c9e3f4a5b6d7
Create Date: 2026-07-31 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260731_0002"
down_revision: str | None = "c9e3f4a5b6d7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(sa.text("UPDATE telegram_jobs SET status = lower(status)"))
    op.alter_column(
        "telegram_jobs",
        "status",
        existing_type=sa.String(length=32),
        existing_nullable=False,
        server_default=sa.text("'pending'"),
    )


def downgrade() -> None:
    op.execute(sa.text("UPDATE telegram_jobs SET status = upper(status)"))
    op.alter_column(
        "telegram_jobs",
        "status",
        existing_type=sa.String(length=32),
        existing_nullable=False,
        server_default=sa.text("'PENDING'"),
    )
