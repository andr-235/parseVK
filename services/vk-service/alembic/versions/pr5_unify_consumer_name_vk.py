"""unify consumer_name for processed_events

Revision ID: pr5_unify_consumer_name_vk
Revises: db20736cd739
Create Date: 2026-07-16 12:00:00.000000

"""
from collections.abc import Sequence

from alembic import op

revision: str = "pr5_unify_consumer_name_vk"
down_revision: str | None = "db20736cd739"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "UPDATE processed_events SET consumer_name = 'vk-service' "
        "WHERE consumer_name = 'vk-service.tasks'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE processed_events SET consumer_name = 'vk-service.tasks' "
        "WHERE consumer_name = 'vk-service'"
    )
