"""Add execution_sequence to vk_task_runs

Revision ID: pr2c1_add_execution_sequence
Revises: pr2a_vk_ingestion_checkpoint
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "pr2c1_add_execution_sequence"
down_revision: str | None = "pr2a_vk_ingestion_checkpoint"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "vk_task_runs",
        sa.Column(
            "execution_sequence",
            sa.BigInteger(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )


def downgrade() -> None:
    op.drop_column("vk_task_runs", "execution_sequence")
