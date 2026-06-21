"""reset stale id sequences after manual data restore"""

from alembic import op

revision = "20260622_0003"
down_revision = "20260508_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("SELECT setval('tasks_id_seq', COALESCE((SELECT max(id) FROM tasks), 1))")
    op.execute("SELECT setval('task_audit_logs_id_seq', COALESCE((SELECT max(id) FROM task_audit_logs), 1))")


def downgrade() -> None:
    pass
