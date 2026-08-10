"""persist ingestion receipt correlation id

Revision ID: 20260810_0008
Revises: 20260809_0007
Create Date: 2026-08-10
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260810_0008"
down_revision: str | Sequence[str] | None = "20260809_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "content_ingestion_receipts",
        sa.Column("correlation_id", sa.String(128), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("content_ingestion_receipts", "correlation_id")
