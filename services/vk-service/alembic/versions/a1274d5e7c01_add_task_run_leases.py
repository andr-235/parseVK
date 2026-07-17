"""add durable leases to VK task runs

Revision ID: a1274d5e7c01
Revises: db20736cd739
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a1274d5e7c01"
down_revision: str | None = "db20736cd739"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "vk_task_runs", sa.Column("attempts", sa.Integer(), server_default="0", nullable=False)
    )
    op.add_column(
        "vk_task_runs",
        sa.Column(
            "available_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.add_column("vk_task_runs", sa.Column("lease_owner", sa.String(length=128), nullable=True))
    op.add_column(
        "vk_task_runs", sa.Column("lease_expires_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "vk_task_runs", sa.Column("heartbeat_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index(
        "ix_vk_task_runs_claimable",
        "vk_task_runs",
        ["status", "available_at", "lease_expires_at"],
    )
    op.execute(
        "UPDATE vk_task_runs SET status = 'pending', available_at = now(), "
        "lease_owner = NULL, lease_expires_at = NULL WHERE status = 'running'"
    )
    op.alter_column("vk_task_runs", "attempts", server_default=None)
    op.alter_column("vk_task_runs", "available_at", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_vk_task_runs_claimable", table_name="vk_task_runs")
    op.drop_column("vk_task_runs", "heartbeat_at")
    op.drop_column("vk_task_runs", "lease_expires_at")
    op.drop_column("vk_task_runs", "lease_owner")
    op.drop_column("vk_task_runs", "available_at")
    op.drop_column("vk_task_runs", "attempts")
