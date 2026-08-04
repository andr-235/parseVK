"""Replace aggregate collections with canonical source-level collections.

Revision ID: pr6b_source_level_collection_identity
Revises: pr6_source_collection_demands
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "pr6b_source_level_collection_identity"
down_revision: str | None = "pr6_source_collection_demands"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_CUTOVER_ERROR = (
    "legacy aggregate execution invalidated by canonical source-level cutover"
)


def upgrade() -> None:
    # Aggregate executions cannot be resumed safely as one-source executions.
    # Terminate active attempts/executions and require a fresh canonical command
    # from the immutable TaskRun snapshot after deployment.
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
    op.create_unique_constraint(
        "uq_vk_collection_demands_demand_id",
        "vk_collection_demands",
        ["demand_id"],
    )
    op.create_unique_constraint(
        "uq_vk_collection_demands_task_run_source",
        "vk_collection_demands",
        ["task_id", "run_id", "source_id"],
    )
    op.create_index(
        "ix_vk_collection_demands_task_run_status",
        "vk_collection_demands",
        ["task_id", "run_id", "status"],
    )
    op.create_index(
        "ix_vk_collection_demands_source",
        "vk_collection_demands",
        ["source_id", "created_at"],
    )


def downgrade() -> None:
    bind = op.get_bind()
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
        raise RuntimeError(
            "Cannot downgrade after canonical source executions were created"
        )
    remaining_demands = bind.execute(
        sa.text("SELECT 1 FROM vk_collection_demands LIMIT 1")
    ).first()
    if remaining_demands is not None:
        raise RuntimeError(
            "Cannot downgrade while canonical source demands exist"
        )

    op.drop_index(
        "ix_vk_collection_demands_source",
        table_name="vk_collection_demands",
    )
    op.drop_index(
        "ix_vk_collection_demands_task_run_status",
        table_name="vk_collection_demands",
    )
    op.drop_constraint(
        "uq_vk_collection_demands_task_run_source",
        "vk_collection_demands",
        type_="unique",
    )
    op.drop_constraint(
        "uq_vk_collection_demands_demand_id",
        "vk_collection_demands",
        type_="unique",
    )
    op.drop_column("vk_collection_demands", "snapshot_sha256")
    op.drop_column("vk_collection_demands", "source_set_revision")
    op.drop_column("vk_collection_demands", "task_revision")
    op.drop_column("vk_collection_demands", "source_id")
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
    op.drop_index(
        "ix_vk_source_collections_source",
        table_name="vk_source_collections",
    )
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

    op.drop_index("ix_vk_executions_task_run", table_name="vk_executions")
    op.create_unique_constraint(
        "uq_vk_executions_task_run",
        "vk_executions",
        ["task_id", "run_id"],
    )
