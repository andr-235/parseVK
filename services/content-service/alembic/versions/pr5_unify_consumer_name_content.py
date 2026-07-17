"""unify consumer_name for processed_events (content-service)

Revision ID: pr5_unify_consumer_name_content
Revises: c7818ea29d6d
Create Date: 2026-07-16 12:00:00.000000

"""
from collections.abc import Sequence

from alembic import op

revision: str = "pr5_unify_consumer_name_content"
down_revision: str | None = "c7818ea29d6d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "UPDATE processed_events SET consumer_name = 'content-service' "
        "WHERE consumer_name = 'content-service.vk'"
    )
    op.execute(
        "UPDATE processed_events SET consumer_name = 'content-service-im' "
        "WHERE consumer_name = 'content-service.im'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE processed_events SET consumer_name = 'content-service.vk' "
        "WHERE consumer_name = 'content-service'"
    )
    op.execute(
        "UPDATE processed_events SET consumer_name = 'content-service.im' "
        "WHERE consumer_name = 'content-service-im'"
    )
