"""add profile fields to content authors

Revision ID: a8a5f82b130a
Revises: 9405ab574a54
Create Date: 2026-05-29 23:15:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a8a5f82b130a'
down_revision: str | None = '9405ab574a54'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('content_authors', sa.Column('first_name', sa.Text(), nullable=True))
    op.add_column('content_authors', sa.Column('last_name', sa.Text(), nullable=True))
    op.add_column('content_authors', sa.Column('photo_50', sa.Text(), nullable=True))
    op.add_column('content_authors', sa.Column('photo_100', sa.Text(), nullable=True))
    op.add_column('content_authors', sa.Column('photo_200', sa.Text(), nullable=True))
    op.add_column('content_authors', sa.Column('domain', sa.Text(), nullable=True))
    op.add_column('content_authors', sa.Column('screen_name', sa.Text(), nullable=True))
    op.add_column('content_authors', sa.Column('city', sa.JSON(), nullable=True))
    op.add_column('content_authors', sa.Column('country', sa.JSON(), nullable=True))
    op.add_column('content_authors', sa.Column('followers_count', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('content_authors', 'followers_count')
    op.drop_column('content_authors', 'country')
    op.drop_column('content_authors', 'city')
    op.drop_column('content_authors', 'screen_name')
    op.drop_column('content_authors', 'domain')
    op.drop_column('content_authors', 'photo_200')
    op.drop_column('content_authors', 'photo_100')
    op.drop_column('content_authors', 'photo_50')
    op.drop_column('content_authors', 'last_name')
    op.drop_column('content_authors', 'first_name')
