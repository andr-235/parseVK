"""Add source collection and demand coalescing model.

Revision ID: pr6_source_collection_demands
Revises: pr5b_active_execution_guard
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "pr6_source_collection_demands"
down_revision: str | None = "pr5b_active_execution_guard"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "vk_source_collections",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("execution_id", UUID(as_uuid=True), nullable=False),
        sa.Column("provider_account_key", sa.String(128), nullable=False),
        sa.Column("source_key", sa.String(512), nullable=False),
        sa.Column("fingerprint", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("plan_snapshot", JSONB(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["execution_id"],
            ["vk_executions.id"],
            name="fk_vk_source_collections_execution",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint(
            "execution_id", name="uq_vk_source_collections_execution"
        ),
    )
    op.create_index(
        "ix_vk_source_collections_execution",
        "vk_source_collections",
        ["execution_id"],
    )
    op.create_index(
        "ix_vk_source_collections_status",
        "vk_source_collections",
        ["status", "created_at"],
    )
    op.create_index(
        "uq_vk_source_collections_active_fingerprint",
        "vk_source_collections",
        ["provider_account_key", "source_key", "fingerprint"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'running')"),
    )

    op.create_table(
        "vk_collection_demands",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("collection_id", UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", sa.BigInteger(), nullable=False),
        sa.Column("run_id", sa.String(128), nullable=False),
        sa.Column("owner_user_id", sa.String(128), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("execution_sequence", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("cancellation_requested_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["collection_id"],
            ["vk_source_collections.id"],
            name="fk_vk_collection_demands_collection",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint(
            "task_id", "run_id", name="uq_vk_collection_demands_task_run"
        ),
    )
    op.create_index(
        "ix_vk_collection_demands_collection",
        "vk_collection_demands",
        ["collection_id", "status"],
    )
    op.create_index(
        "ix_vk_collection_demands_task",
        "vk_collection_demands",
        ["task_id", "created_at"],
    )
    op.create_index(
        "uq_vk_collection_demands_active_task",
        "vk_collection_demands",
        ["task_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'running')"),
    )

    op.execute(
        """
        INSERT INTO vk_source_collections (
            id, execution_id, provider_account_key, source_key, fingerprint,
            status, plan_snapshot, started_at, finished_at, last_error,
            created_at, updated_at
        )
        SELECT
            e.id,
            e.id,
            COALESCE(a.provider_account_key, 'system-vk'),
            'legacy:execution:' || e.id::text,
            md5(e.id::text || ':source') || md5(e.id::text || ':plan'),
            e.status,
            e.plan_snapshot,
            e.started_at,
            e.finished_at,
            e.last_error,
            e.created_at,
            e.updated_at
        FROM vk_executions e
        LEFT JOIN vk_execution_attempts a ON a.id = e.current_attempt_id
        """
    )
    op.execute(
        """
        INSERT INTO vk_collection_demands (
            id, collection_id, task_id, run_id, owner_user_id, status,
            execution_sequence, cancellation_requested_at,
            cancellation_reason, last_error, created_at, updated_at, finished_at
        )
        SELECT
            md5(e.id::text || ':demand')::uuid,
            e.id,
            e.task_id,
            e.run_id,
            e.owner_user_id,
            e.status,
            e.execution_sequence,
            e.cancellation_requested_at,
            e.cancellation_reason,
            e.last_error,
            e.created_at,
            e.updated_at,
            e.finished_at
        FROM vk_executions e
        """
    )
    op.alter_column(
        "vk_collection_demands", "execution_sequence", server_default=None
    )


def downgrade() -> None:
    op.drop_index(
        "uq_vk_collection_demands_active_task",
        table_name="vk_collection_demands",
    )
    op.drop_index(
        "ix_vk_collection_demands_task", table_name="vk_collection_demands"
    )
    op.drop_index(
        "ix_vk_collection_demands_collection", table_name="vk_collection_demands"
    )
    op.drop_table("vk_collection_demands")

    op.drop_index(
        "uq_vk_source_collections_active_fingerprint",
        table_name="vk_source_collections",
    )
    op.drop_index(
        "ix_vk_source_collections_status", table_name="vk_source_collections"
    )
    op.drop_index(
        "ix_vk_source_collections_execution", table_name="vk_source_collections"
    )
    op.drop_table("vk_source_collections")
