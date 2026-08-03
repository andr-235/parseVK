"""Enforce one active VK execution per task.

Revision ID: pr5b_active_execution_guard
Revises: pr5_vk_execution_attempts
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "pr5b_active_execution_guard"
down_revision: str | None = "pr5_vk_execution_attempts"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "uq_vk_executions_active_task",
        "vk_executions",
        ["task_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'running')"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_vk_executions_active_task",
        table_name="vk_executions",
    )
