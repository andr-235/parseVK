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

INDEX_NAME = "ix_im_messages_text_trgm"


def _index_exists() -> bool:
    """Check if the index exists on im_messages in the public schema."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT 1 "
            "FROM pg_index i "
            "JOIN pg_class idx ON idx.oid = i.indexrelid "
            "JOIN pg_class tbl ON tbl.oid = i.indrelid "
            "JOIN pg_namespace nsp ON nsp.oid = idx.relnamespace "
            "WHERE idx.relname = :name "
            "  AND tbl.relname = 'im_messages' "
            "  AND nsp.nspname = 'public'"
        ),
        {"name": INDEX_NAME},
    )
    return result.scalar() is not None


def _index_is_valid() -> bool:
    """Check if the index is valid (indisvalid = true)."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT i.indisvalid "
            "FROM pg_index i "
            "JOIN pg_class idx ON idx.oid = i.indexrelid "
            "JOIN pg_class tbl ON tbl.oid = i.indrelid "
            "JOIN pg_namespace nsp ON nsp.oid = idx.relnamespace "
            "WHERE idx.relname = :name "
            "  AND tbl.relname = 'im_messages' "
            "  AND nsp.nspname = 'public'"
        ),
        {"name": INDEX_NAME},
    )
    row = result.fetchone()
    return row is not None and row[0]


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))

        if _index_exists():
            if _index_is_valid():
                # Index already exists and is valid — nothing to do
                return
            # Index exists but is invalid (e.g. after a failed CONCURRENTLY)
            op.execute(
                sa.text(
                    f"DROP INDEX CONCURRENTLY IF EXISTS {INDEX_NAME}"
                )
            )

        op.execute(
            sa.text(
                f"CREATE INDEX CONCURRENTLY {INDEX_NAME} "
                f"ON im_messages USING gin (text gin_trgm_ops)"
            )
        )


def downgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute(
            sa.text(f"DROP INDEX CONCURRENTLY IF EXISTS {INDEX_NAME}")
        )
