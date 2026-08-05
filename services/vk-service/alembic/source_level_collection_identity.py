"""Replace aggregate collections with canonical source-level collections.

Revision ID: pr6b_source_level_collection_identity
Revises: pr6_source_collection_demands
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "pr6b_source_level_collection_identity"
down_revision: str | None = "pr6_source_collection_demands"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_CUTOVER_ERROR = (
    "legacy aggregate execution invalidated by canonical source-level cutover"
)


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE vk_execution_attempts
            SET status = 'failed',
                finished_at = COALESCE(finished_at, now()),
                last_error = :error
            WHERE status = 'running'
            """
        ).bindparams(error=_CUTOVER_ERROR)
    )
    op.execute(
        sa.text(
            """
            UPDATE vk_executions
            SET status = 'failed',
                finished_at = COALESCE(finished_at, now()),
                last_error = :error,
                cancellation_requested_at = COALESCE(
                    cancellation_requested_at,
                    now()
                ),
                cancellation_reason = COALESCE(
                    cancellation_reason,
                    :error
                ),
                updated_at = now()
            WHERE status IN ('pending', 'running')
            """
        ).bindparams(error=_CUTOVER_ERROR)
    )
    op.execute("DELETE FROM vk_collection_demands")
    op.execute("DELETE FROM vk_source_collections")

    op.drop_constraint(
        "uq_vk_executions_task_run",
        "vk_executions",
        type_="unique",
    )
    op.create_index(
        "ix_vk_executions_task_run",
        "vk_executions",
        ["task_id", "run_id"],
    )

    op.create_table(
        "vk_task_run_bindings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("command_execution_id", UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", sa.BigInteger(), nullable=False),
        sa.Column("run_id", sa.String(128), nullable=False),
        sa.Column("owner_user_id", sa.String(128), nullable=False),
        sa.Column("task_revision", sa.Integer(), nullable=False),
        sa.Column("source_set_revision", sa.Integer(), nullable=False),
        sa.Column("snapshot_sha256", sa.String(64), nullable=False),
        sa.Column("expected_demands", sa.Integer(), nullable=False),
        sa.Column("completed_demands", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_demands", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cancelled_demands", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("processed_items", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_items", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("stats", JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("execution_sequence", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("cancellation_requested_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint(
            "task_id",
            "run_id",
            name="uq_vk_task_run_bindings_task_run",
        ),
        sa.UniqueConstraint(
            "command_execution_id",
            name="uq_vk_task_run_bindings_command_execution",
        ),
    )
    op.create_index(
        "ix_vk_task_run_bindings_status",
        "vk_task_run_bindings",
        ["status", "created_at"],
    )
    op.create_index(
        "uq_vk_task_run_bindings_active_task",
        "vk_task_run_bindings",
        ["task_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'running')"),
    )

    op.drop_index(
        "uq_vk_source_collections_active_fingerprint",
        table_name="vk_source_collections",
    )
    op.add_column(
        "vk_source_collections",
        sa.Column("source_id", UUID(as_uuid=True), nullable=False),
    )
    op.add_column(
        "vk_source_collections",
        sa.Column("source_provider", sa.String(32), nullable=False),
    )
    op.add_column(
        "vk_source_collections",
        sa.Column("source_type", sa.String(64), nullable=False),
    )
    op.add_column(
        "vk_source_collections",
        sa.Column("source_external_id", sa.String(128), nullable=False),
    )
    op.add_column(
        "vk_source_collections",
        sa.Column("source_owner_id", sa.BigInteger(), nullable=False),
    )
    op.create_index(
        "ix_vk_source_collections_source",
        "vk_source_collections",
        ["source_id", "created_at"],
    )
    op.create_index(
        "uq_vk_source_collections_active_fingerprint",
        "vk_source_collections",
        ["provider_account_key", "source_key", "fingerprint"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'running')"),
    )

    op.drop_index(
        "uq_vk_collection_demands_active_task",
        table_name="vk_collection_demands",
    )
    op.drop_constraint(
        "uq_vk_collection_demands_task_run",
        "vk_collection_demands",
        type_="unique",
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("demand_id", UUID(as_uuid=True), nullable=False),
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("binding_id", UUID(as_uuid=True), nullable=False),
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("source_id", UUID(as_uuid=True), nullable=False),
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("task_revision", sa.Integer(), nullable=False),
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("source_set_revision", sa.Integer(), nullable=False),
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("snapshot_sha256", sa.String(64), nullable=False),
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("processed_items", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("total_items", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("stats", JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    op.create_foreign_key(
        "fk_vk_collection_demands_binding",
        "vk_collection_demands",
        "vk_task_run_bindings",
        ["binding_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_unique_constraint(
        "uq_vk_collection_demands_demand_id",
        "vk_collection_demands",
        ["demand_id"],
    )
    op.create_unique_constraint(
        "uq_vk_collection_demands_binding_source",
        "vk_collection_demands",
        ["binding_id", "source_id"],
    )
    op.create_index(
        "ix_vk_collection_demands_binding",
        "vk_collection_demands",
        ["binding_id", "status"],
    )
    op.create_index(
        "ix_vk_collection_demands_source",
        "vk_collection_demands",
        ["source_id", "created_at"],
    )

    for table_name in ("vk_task_run_bindings", "vk_collection_demands"):
        for column_name in (
            "completed_demands",
            "failed_demands",
            "cancelled_demands",
            "processed_items",
            "total_items",
            "execution_sequence",
        ):
            if table_name == "vk_collection_demands" and column_name in {
                "completed_demands",
                "failed_demands",
                "cancelled_demands",
                "execution_sequence",
            }:
                continue
            op.alter_column(table_name, column_name, server_default=None)
    op.alter_column("vk_task_run_bindings", "stats", server_default=None)
    op.alter_column("vk_collection_demands", "stats", server_default=None)


def downgrade() -> None:
    bind = op.get_bind()
    if bind.execute(sa.text("SELECT 1 FROM vk_task_run_bindings LIMIT 1")).first():
        raise RuntimeError("Cannot downgrade while canonical TaskRun bindings exist")
    duplicate_execution = bind.execute(
        sa.text(
            """
            SELECT task_id, run_id
            FROM vk_executions
            GROUP BY task_id, run_id
            HAVING count(*) > 1
            LIMIT 1
            """
        )
    ).first()
    if duplicate_execution is not None:
        raise RuntimeError("Cannot downgrade after canonical source executions were created")

    op.drop_index("ix_vk_collection_demands_source", table_name="vk_collection_demands")
    op.drop_index("ix_vk_collection_demands_binding", table_name="vk_collection_demands")
    op.drop_constraint(
        "uq_vk_collection_demands_binding_source",
        "vk_collection_demands",
        type_="unique",
    )
    op.drop_constraint(
        "uq_vk_collection_demands_demand_id",
        "vk_collection_demands",
        type_="unique",
    )
    op.drop_constraint(
        "fk_vk_collection_demands_binding",
        "vk_collection_demands",
        type_="foreignkey",
    )
    op.drop_column("vk_collection_demands", "stats")
    op.drop_column("vk_collection_demands", "total_items")
    op.drop_column("vk_collection_demands", "processed_items")
    op.drop_column("vk_collection_demands", "snapshot_sha256")
    op.drop_column("vk_collection_demands", "source_set_revision")
    op.drop_column("vk_collection_demands", "task_revision")
    op.drop_column("vk_collection_demands", "source_id")
    op.drop_column("vk_collection_demands", "binding_id")
    op.drop_column("vk_collection_demands", "demand_id")
    op.create_unique_constraint(
        "uq_vk_collection_demands_task_run",
        "vk_collection_demands",
        ["task_id", "run_id"],
    )
    op.create_index(
        "uq_vk_collection_demands_active_task",
        "vk_collection_demands",
        ["task_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'running')"),
    )

    op.drop_index(
        "uq_vk_source_collections_active_fingerprint",
        table_name="vk_source_collections",
    )
    op.drop_index("ix_vk_source_collections_source", table_name="vk_source_collections")
    op.drop_column("vk_source_collections", "source_owner_id")
    op.drop_column("vk_source_collections", "source_external_id")
    op.drop_column("vk_source_collections", "source_type")
    op.drop_column("vk_source_collections", "source_provider")
    op.drop_column("vk_source_collections", "source_id")
    op.create_index(
        "uq_vk_source_collections_active_fingerprint",
        "vk_source_collections",
        ["provider_account_key", "source_key", "fingerprint"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'running')"),
    )

    op.drop_index(
        "uq_vk_task_run_bindings_active_task",
        table_name="vk_task_run_bindings",
    )
    op.drop_index("ix_vk_task_run_bindings_status", table_name="vk_task_run_bindings")
    op.drop_table("vk_task_run_bindings")

    op.drop_index("ix_vk_executions_task_run", table_name="vk_executions")
    op.create_unique_constraint(
        "uq_vk_executions_task_run",
        "vk_executions",
        ["task_id", "run_id"],
    )
