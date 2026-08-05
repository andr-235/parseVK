"""Add authoritative source-set revision to tasks.

Revision ID: p2h1_source_set_revision
Revises: p1_task_run_snapshot

The backfill preserves monotonicity relative to both the previous task revision
and already frozen TaskRun metadata. Historical source-set changes cannot be
reconstructed, so this migration establishes a deterministic baseline for all
future effective-set mutations.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "p2h1_source_set_revision"
down_revision: str | None = "p1_task_run_snapshot"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column(
            "source_set_revision",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    op.execute(
        """
        UPDATE tasks AS task
        SET source_set_revision = GREATEST(
            COALESCE(task.revision, 0),
            COALESCE(
                (
                    SELECT MAX(task_run.source_set_revision)
                    FROM task_runs AS task_run
                    WHERE task_run.task_id = task.id
                ),
                0
            )
        )
        """
    )
    op.create_check_constraint(
        "ck_tasks_source_set_revision",
        "tasks",
        "source_set_revision >= 0",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_tasks_source_set_revision",
        "tasks",
        type_="check",
    )
    op.drop_column("tasks", "source_set_revision")
