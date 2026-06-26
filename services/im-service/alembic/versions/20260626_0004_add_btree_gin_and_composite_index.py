"""enable btree_gin and add composite GIN index for messenger + text trigram

Revision ID: 20260626_0004
Revises: 20260626_0003
Create Date: 2026-06-26 14:00:00.000000

"""
from collections.abc import Sequence

from alembic import op

revision: str = "20260626_0004"
down_revision: str | None = "20260626_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gin")

    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_im_messages_messenger_text_trgm "
        "ON im_messages USING gin (messenger, text gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_im_messages_messenger_text_trgm")
