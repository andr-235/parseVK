"""add task execution run id"""

import sqlalchemy as sa
from alembic import op

revision = "20260508_0002"
down_revision = "20260507_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("execution_run_id", sa.String(length=128), nullable=True))
    op.create_index("ix_tasks_execution_run_id", "tasks", ["execution_run_id"])


def downgrade() -> None:
    op.drop_index("ix_tasks_execution_run_id", table_name="tasks")
    op.drop_column("tasks", "execution_run_id")
