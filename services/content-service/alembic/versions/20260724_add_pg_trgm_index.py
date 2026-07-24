"""add pg_trgm extension and gin index on im_messages.text

Revision ID: 20260724_add_pg_trgm_index
Revises: 20260720_im_messages_projection
Create Date: 2026-07-24 16:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260724_add_pg_trgm_index"
down_revision: str | Sequence[str] | None = "20260720_im_messages_projection"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # CREATE EXTENSION and CREATE INDEX CONCURRENTLY cannot run inside a
    # transaction. Use autocommit_block to commit any active transaction first,
    # execute the DDL in autocommit mode, and then resume normal transactional
    # behavior for the remainder of the migration script.
    with op.get_context().autocommit_block():
        op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        op.execute(
            sa.text(
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_im_messages_text_trgm "
                "ON im_messages USING gin (text gin_trgm_ops)"
            )
        )


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute(
            sa.text("DROP INDEX CONCURRENTLY IF EXISTS ix_im_messages_text_trgm")
        )
