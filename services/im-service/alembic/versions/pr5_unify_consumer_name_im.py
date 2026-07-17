"""unify consumer_name for processed_events (im-service)

Revision ID: pr5_unify_consumer_name_im
Revises: 20260626_0004
Create Date: 2026-07-16 12:00:00.000000

"""
from collections.abc import Sequence

from alembic import op

revision: str = "pr5_unify_consumer_name_im"
down_revision: str | None = "20260626_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "UPDATE processed_events SET consumer_name = 'im-service' "
        "WHERE consumer_name = 'im-service.tasks'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE processed_events SET consumer_name = 'im-service.tasks' "
        "WHERE consumer_name = 'im-service'"
    )
