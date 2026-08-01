"""Add task_runs and task_run_source_demands.

Revision ID: 20260801_0002_add_task_run_tables
Revises: 20260801_0001_add_source_scope_tables
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "20260801_0002_add_task_run_tables"
down_revision: str | None = "20260801_0001_add_source_scope_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "task_runs",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", sa.BigInteger(), nullable=False),
        sa.Column("run_revision", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="requested"),
        sa.Column("source_set_revision", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("snapshot_sha256", sa.String(length=64), nullable=False),
        sa.Column("config_snapshot", JSONB(), nullable=False),
        sa.Column("source_set_snapshot", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "status IN ('requested', 'running', 'completed', 'failed', 'cancelled')",
            name="ck_task_runs_status",
        ),
        sa.CheckConstraint("run_revision >= 0", name="ck_task_runs_run_revision"),
        sa.CheckConstraint("source_set_revision >= 0", name="ck_task_runs_source_set_revision"),
        sa.CheckConstraint(
            "snapshot_sha256 ~ '^[0-9a-f]{64}$'",
            name="ck_task_runs_snapshot_sha256",
        ),
        sa.CheckConstraint(
            "jsonb_typeof(source_set_snapshot) = 'array'",
            name="ck_task_runs_source_set_array",
        ),
    )
    op.create_index("ix_task_runs_task_created", "task_runs", ["task_id", "created_at"])
    op.create_table(
        "task_run_source_demands",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("task_run_id", UUID(as_uuid=True), nullable=False),
        sa.Column("source_id", UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("payload", JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["task_run_id"], ["task_runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_id"], ["monitoring_sources.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_run_id", "source_id", name="uq_task_run_source_demands_run_source"),
        sa.CheckConstraint(
            "status IN ('active', 'completed', 'failed', 'cancelled')",
            name="ck_task_run_source_demands_status",
        ),
        sa.CheckConstraint("jsonb_typeof(payload) = 'object'", name="ck_task_run_demands_payload_object"),
    )
    op.create_index("ix_task_run_source_demands_run", "task_run_source_demands", ["task_run_id"])
    op.create_index("ix_task_run_source_demands_source", "task_run_source_demands", ["source_id"])

    op.execute(
        """
        CREATE FUNCTION reject_task_run_snapshot_update()
        RETURNS trigger AS $$
        BEGIN
            IF NEW.task_id IS DISTINCT FROM OLD.task_id
               OR NEW.run_revision IS DISTINCT FROM OLD.run_revision
               OR NEW.source_set_revision IS DISTINCT FROM OLD.source_set_revision
               OR NEW.snapshot_sha256 IS DISTINCT FROM OLD.snapshot_sha256
               OR NEW.config_snapshot IS DISTINCT FROM OLD.config_snapshot
               OR NEW.source_set_snapshot IS DISTINCT FROM OLD.source_set_snapshot
               OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
                RAISE EXCEPTION 'task run snapshot fields are immutable';
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_task_runs_immutable_snapshot
        BEFORE UPDATE ON task_runs
        FOR EACH ROW EXECUTE FUNCTION reject_task_run_snapshot_update();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_task_runs_immutable_snapshot ON task_runs")
    op.execute("DROP FUNCTION IF EXISTS reject_task_run_snapshot_update()")
    op.drop_index("ix_task_run_source_demands_source", table_name="task_run_source_demands")
    op.drop_index("ix_task_run_source_demands_run", table_name="task_run_source_demands")
    op.drop_table("task_run_source_demands")
    op.drop_index("ix_task_runs_task_created", table_name="task_runs")
    op.drop_table("task_runs")
