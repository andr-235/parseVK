"""Add authoritative source-set revision to tasks.

Revision ID: p2h1_source_set_revision
Revises: p1_task_run_snapshot

Historical source-set transitions cannot be reconstructed. The migration
therefore assigns the current effective set a deterministic revision above all
already frozen TaskRuns whenever the task currently has normalized sources.
Future mutations advance this baseline monotonically.
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
        SET source_set_revision =
            COALESCE(
                (
                    SELECT MAX(task_run.source_set_revision)
                    FROM task_runs AS task_run
                    WHERE task_run.task_id = task.id
                ),
                0
            )
            + CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM task_sources AS task_source
                    WHERE task_source.task_id = task.id
                ) THEN 1
                ELSE 0
              END
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
