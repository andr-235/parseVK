"""Replace legacy VK task runtime with fenced executions and attempts.

Revision ID: pr5_vk_execution_attempts
Revises: pr4_vk_provider_accounts
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID

revision: str = "pr5_vk_execution_attempts"
down_revision: str | None = "pr4_vk_provider_accounts"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "vk_executions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", sa.BigInteger(), nullable=False),
        sa.Column("owner_user_id", sa.String(128), nullable=False),
        sa.Column("run_id", sa.String(128), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("scope", sa.String(32), nullable=False),
        sa.Column("mode", sa.String(64), nullable=False),
        sa.Column("group_ids", ARRAY(sa.BigInteger()), nullable=False),
        sa.Column("post_limit", sa.Integer(), nullable=True),
        sa.Column("plan_snapshot", JSONB(), nullable=False),
        sa.Column("processed_items", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_items", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("current_attempt_id", UUID(as_uuid=True), nullable=True),
        sa.Column("current_fencing_token", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("cancellation_requested_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("parent_execution_id", UUID(as_uuid=True), nullable=True),
        sa.Column("execution_sequence", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["parent_execution_id"],
            ["vk_executions.id"],
            name="fk_vk_executions_parent",
            ondelete="SET NULL",
        ),
        sa.UniqueConstraint("task_id", "run_id", name="uq_vk_executions_task_run"),
    )
    op.create_index(
        "ix_vk_executions_claimable",
        "vk_executions",
        ["status", "available_at"],
    )
    op.create_index("ix_vk_executions_task_id", "vk_executions", ["task_id"])

    op.create_table(
        "vk_execution_attempts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("execution_id", UUID(as_uuid=True), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("fencing_token", sa.BigInteger(), nullable=False),
        sa.Column("worker_id", sa.String(128), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("provider_account_key", sa.String(128), nullable=False),
        sa.Column("credential_version", sa.String(64), nullable=False),
        sa.Column("lease_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("heartbeat_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["execution_id"],
            ["vk_executions.id"],
            name="fk_vk_execution_attempts_execution",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint(
            "execution_id",
            "attempt_number",
            name="uq_vk_execution_attempt_number",
        ),
        sa.UniqueConstraint(
            "execution_id",
            "fencing_token",
            name="uq_vk_execution_fencing_token",
        ),
    )
    op.create_index(
        "ix_vk_execution_attempts_lease",
        "vk_execution_attempts",
        ["status", "lease_expires_at"],
    )
    op.create_index(
        "uq_vk_execution_attempts_running",
        "vk_execution_attempts",
        ["execution_id"],
        unique=True,
        postgresql_where=sa.text("status = 'running'"),
    )
    op.create_foreign_key(
        "fk_vk_executions_current_attempt",
        "vk_executions",
        "vk_execution_attempts",
        ["current_attempt_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.execute(
        """
        INSERT INTO vk_executions (
            id, task_id, owner_user_id, run_id, status, scope, mode,
            group_ids, post_limit, plan_snapshot, processed_items, total_items,
            last_error, available_at, current_fencing_token,
            cancellation_requested_at, cancellation_reason,
            execution_sequence, started_at, finished_at, created_at, updated_at
        )
        SELECT
            id,
            task_id,
            owner_user_id,
            run_id,
            CASE WHEN status = 'running' THEN 'pending' ELSE status END,
            scope,
            mode,
            group_ids,
            post_limit,
            jsonb_build_object(
                'scope', scope,
                'mode', mode,
                'groupIds', group_ids,
                'postLimit', post_limit,
                'migratedFrom', 'vk_task_runs'
            ),
            processed_items,
            total_items,
            last_error,
            CASE WHEN status = 'running' THEN now() ELSE available_at END,
            GREATEST(attempts, 0),
            CASE WHEN status = 'cancelled' THEN finished_at ELSE NULL END,
            CASE WHEN status = 'cancelled' THEN COALESCE(last_error, 'legacy cancellation') ELSE NULL END,
            execution_sequence,
            started_at,
            finished_at,
            created_at,
            updated_at
        FROM vk_task_runs
        """
    )
    op.drop_table("vk_task_runs")

    op.alter_column("vk_executions", "processed_items", server_default=None)
    op.alter_column("vk_executions", "total_items", server_default=None)
    op.alter_column("vk_executions", "current_fencing_token", server_default=None)
    op.alter_column("vk_executions", "execution_sequence", server_default=None)


def downgrade() -> None:
    op.create_table(
        "vk_task_runs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", sa.BigInteger(), nullable=False),
        sa.Column("owner_user_id", sa.String(128), nullable=False),
        sa.Column("run_id", sa.String(128), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("scope", sa.String(32), nullable=False),
        sa.Column("mode", sa.String(64), nullable=False),
        sa.Column("group_ids", ARRAY(sa.BigInteger()), nullable=False),
        sa.Column("post_limit", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("processed_items", sa.Integer(), nullable=False),
        sa.Column("total_items", sa.Integer(), nullable=False),
        sa.Column("execution_sequence", sa.BigInteger(), nullable=False),
        sa.Column("provider_account_key", sa.String(128), nullable=True),
        sa.Column("credential_version", sa.String(64), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("lease_owner", sa.String(128), nullable=True),
        sa.Column("lease_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("heartbeat_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("task_id", name="uq_vk_task_runs_task_id"),
    )
    op.create_index("ix_vk_task_runs_task_id", "vk_task_runs", ["task_id"])
    op.create_index(
        "ix_vk_task_runs_claimable",
        "vk_task_runs",
        ["status", "available_at", "lease_expires_at"],
    )
    op.execute(
        """
        INSERT INTO vk_task_runs (
            id, task_id, owner_user_id, run_id, status, scope, mode,
            group_ids, post_limit, started_at, finished_at,
            processed_items, total_items, execution_sequence,
            provider_account_key, credential_version, last_error, attempts,
            available_at, lease_owner, lease_expires_at, heartbeat_at,
            created_at, updated_at
        )
        SELECT DISTINCT ON (e.task_id)
            e.id,
            e.task_id,
            e.owner_user_id,
            e.run_id,
            e.status,
            e.scope,
            e.mode,
            e.group_ids,
            e.post_limit,
            e.started_at,
            e.finished_at,
            e.processed_items,
            e.total_items,
            e.execution_sequence,
            a.provider_account_key,
            a.credential_version,
            e.last_error,
            e.current_fencing_token::integer,
            e.available_at,
            CASE WHEN a.status = 'running' THEN a.worker_id ELSE NULL END,
            CASE WHEN a.status = 'running' THEN a.lease_expires_at ELSE NULL END,
            CASE WHEN a.status = 'running' THEN a.heartbeat_at ELSE NULL END,
            e.created_at,
            e.updated_at
        FROM vk_executions e
        LEFT JOIN vk_execution_attempts a ON a.id = e.current_attempt_id
        ORDER BY e.task_id, e.created_at DESC
        """
    )

    op.drop_constraint(
        "fk_vk_executions_current_attempt",
        "vk_executions",
        type_="foreignkey",
    )
    op.drop_index("uq_vk_execution_attempts_running", table_name="vk_execution_attempts")
    op.drop_index("ix_vk_execution_attempts_lease", table_name="vk_execution_attempts")
    op.drop_table("vk_execution_attempts")
    op.drop_index("ix_vk_executions_task_id", table_name="vk_executions")
    op.drop_index("ix_vk_executions_claimable", table_name="vk_executions")
    op.drop_table("vk_executions")
