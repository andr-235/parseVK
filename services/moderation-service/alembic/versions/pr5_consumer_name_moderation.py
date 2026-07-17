"""record the moderation consumer-name migration

Revision ID: pr5_consumer_name_moderation
Revises: 6d4e8f1c2a3d
Create Date: 2026-07-16 12:00:00.000000

"""
from collections.abc import Sequence

revision: str = "pr5_consumer_name_moderation"
down_revision: str | None = "6d4e8f1c2a3d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Moderation already uses "moderation-service" consistently in both
    # consumer and service layers, so no data migration is needed.
    pass


def downgrade() -> None:
    pass
