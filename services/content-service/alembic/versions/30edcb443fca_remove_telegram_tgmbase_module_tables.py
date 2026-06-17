"""remove telegram tgmbase module tables

Revision ID: 30edcb443fca
Revises: c7818ea29d6d
Create Date: 2026-06-17 20:49:45.303156

"""
from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = '30edcb443fca'
down_revision: str | None = 'c7818ea29d6d'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
