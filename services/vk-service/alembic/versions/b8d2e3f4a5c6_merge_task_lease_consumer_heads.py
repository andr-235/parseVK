"""merge task-lease and consumer-name migration heads

Revision ID: b8d2e3f4a5c6
Revises: a1274d5e7c01, pr5_unify_consumer_name_vk
"""

from collections.abc import Sequence

revision: str = "b8d2e3f4a5c6"
down_revision: tuple[str, str] = (
    "a1274d5e7c01",
    "pr5_unify_consumer_name_vk",
)
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
