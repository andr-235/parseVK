"""merge Telegram migration heads

Revision ID: c9e3f4a5b6d7
Revises: 20260615_0001, 8aea73d2c748
"""

from collections.abc import Sequence

revision: str = "c9e3f4a5b6d7"
down_revision: tuple[str, str] = ("20260615_0001", "8aea73d2c748")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
