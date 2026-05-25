"""create tasks tables"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260507_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("owner_user_id", sa.String(length=128), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("scope", sa.String(length=32), nullable=True),
        sa.Column("mode", sa.String(length=64), nullable=True),
        sa.Column("group_ids", postgresql.ARRAY(sa.BigInteger()), nullable=False),
        sa.Column("post_limit", sa.Integer(), nullable=True),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("total_items", sa.Integer(), nullable=False),
        sa.Column("processed_items", sa.Integer(), nullable=False),
        sa.Column("progress", sa.Float(), nullable=False),
        sa.Column("stats", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("skipped_groups_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "mode IS NULL OR mode IN ('recent_posts', 'recheck_group')",
            name="ck_tasks_mode",
        ),
        sa.CheckConstraint(
            "post_limit IS NULL OR post_limit BETWEEN 1 AND 100",
            name="ck_tasks_post_limit_range",
        ),
        sa.CheckConstraint("processed_items >= 0", name="ck_tasks_processed_non_negative"),
        sa.CheckConstraint("processed_items <= total_items", name="ck_tasks_processed_lte_total"),
        sa.CheckConstraint("progress >= 0 AND progress <= 1", name="ck_tasks_progress_range"),
        sa.CheckConstraint("scope IS NULL OR scope IN ('all', 'selected')", name="ck_tasks_scope"),
        sa.CheckConstraint("source IN ('manual', 'automation')", name="ck_tasks_source"),
        sa.CheckConstraint(
            "status IN ('pending', 'running', 'done', 'failed', 'cancelled')",
            name="ck_tasks_status",
        ),
        sa.CheckConstraint("total_items >= 0", name="ck_tasks_total_non_negative"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tasks_owner_created", "tasks", ["owner_user_id", "created_at", "id"])
    op.create_index("ix_tasks_owner_source_status", "tasks", ["owner_user_id", "source", "status"])
    op.create_index("ix_tasks_owner_status", "tasks", ["owner_user_id", "status"])

    op.create_table(
        "task_automation_settings",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("owner_user_id", sa.String(length=128), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("run_hour", sa.Integer(), nullable=False),
        sa.Column("run_minute", sa.Integer(), nullable=False),
        sa.Column("post_limit", sa.Integer(), nullable=False),
        sa.Column("timezone_offset_minutes", sa.Integer(), nullable=False),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("post_limit BETWEEN 1 AND 100", name="ck_task_automation_post_limit"),
        sa.CheckConstraint("run_hour BETWEEN 0 AND 23", name="ck_task_automation_run_hour"),
        sa.CheckConstraint("run_minute BETWEEN 0 AND 59", name="ck_task_automation_run_minute"),
        sa.CheckConstraint(
            "timezone_offset_minutes BETWEEN -720 AND 840",
            name="ck_task_automation_timezone_offset",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_user_id", name="uq_task_automation_settings_owner"),
    )

    op.create_table(
        "outbox_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=255), nullable=False),
        sa.Column("event_version", sa.Integer(), nullable=False),
        sa.Column("aggregate_type", sa.String(length=128), nullable=False),
        sa.Column("aggregate_id", sa.String(length=128), nullable=False),
        sa.Column("correlation_id", sa.String(length=128), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_outbox_events_aggregate", "outbox_events", ["aggregate_type", "aggregate_id"])
    op.create_index("ix_outbox_events_status_next_attempt", "outbox_events", ["status", "next_attempt_at"])

    op.create_table(
        "task_audit_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("owner_user_id", sa.String(length=128), nullable=False),
        sa.Column("aggregate_type", sa.String(length=128), nullable=False),
        sa.Column("aggregate_id", sa.String(length=128), nullable=True),
        sa.Column("task_id", sa.BigInteger(), nullable=True),
        sa.Column("event_type", sa.String(length=255), nullable=False),
        sa.Column("event_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_task_audit_logs_owner_created", "task_audit_logs", ["owner_user_id", "created_at"])
    op.create_index("ix_task_audit_logs_task_created", "task_audit_logs", ["task_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_task_audit_logs_task_created", table_name="task_audit_logs")
    op.drop_index("ix_task_audit_logs_owner_created", table_name="task_audit_logs")
    op.drop_table("task_audit_logs")
    op.drop_index("ix_outbox_events_status_next_attempt", table_name="outbox_events")
    op.drop_index("ix_outbox_events_aggregate", table_name="outbox_events")
    op.drop_table("outbox_events")
    op.drop_table("task_automation_settings")
    op.drop_index("ix_tasks_owner_status", table_name="tasks")
    op.drop_index("ix_tasks_owner_source_status", table_name="tasks")
    op.drop_index("ix_tasks_owner_created", table_name="tasks")
    op.drop_table("tasks")
