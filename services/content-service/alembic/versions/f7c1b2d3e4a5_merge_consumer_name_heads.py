"""merge content consumer-name migration heads

Revision ID: f7c1b2d3e4a5
Revises: 30edcb443fcb, pr5_unify_consumer_name_content
"""

from collections.abc import Sequence

revision: str = "f7c1b2d3e4a5"
down_revision: tuple[str, str] = (
    "30edcb443fcb",
    "pr5_unify_consumer_name_content",
)
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
