"""unify consumer_name for processed_events (moderation — no change needed, already consistent)

Revision ID: pr5_unify_consumer_name_moderation
Revises: 6d4e8f1c2a3d
Create Date: 2026-07-16 12:00:00.000000

"""
from collections.abc import Sequence

from alembic import op

revision: str = "pr5_unify_consumer_name_moderation"
down_revision: str | None = "6d4e8f1c2a3d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Moderation already uses "moderation-service" consistently in both
    # consumer and service layers — no data migration needed.
    pass


def downgrade() -> None:
    pass
