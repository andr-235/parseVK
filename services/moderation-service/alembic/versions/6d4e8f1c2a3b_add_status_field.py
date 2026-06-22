"""add status field and post_url to moderation_comments

Revision ID: 6d4e8f1c2a3b
Revises: 7e41fccb26f6
Create Date: 2026-06-22 16:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = '6d4e8f1c2a3b'
down_revision: str | None = '7e41fccb26f6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('moderation_comments',
        sa.Column('status', sa.String(32), nullable=False, server_default='Новый')
    )
    op.execute("UPDATE moderation_comments SET status = 'Проверка' WHERE is_read = TRUE")
    op.alter_column('moderation_comments', 'status', server_default=None)
    op.create_index('ix_moderation_comments_status', 'moderation_comments', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_moderation_comments_status', table_name='moderation_comments')
    op.drop_column('moderation_comments', 'status')
