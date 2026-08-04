"""Add source-level collection and demand identity.

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


def upgrade() -> None:
    op.drop_index(
        "uq_vk_source_collections_active_fingerprint",
        table_name="vk_source_collections",
    )
    op.add_column(
        "vk_source_collections",
        sa.Column(
            "identity_version",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )
    op.add_column(
        "vk_source_collections",
        sa.Column("source_id", UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "vk_source_collections",
        sa.Column("source_provider", sa.String(32), nullable=True),
    )
    op.add_column(
        "vk_source_collections",
        sa.Column("source_type", sa.String(64), nullable=True),
    )
    op.add_column(
        "vk_source_collections",
        sa.Column("source_external_id", sa.String(128), nullable=True),
    )
    op.add_column(
        "vk_source_collections",
        sa.Column("source_owner_id", sa.BigInteger(), nullable=True),
    )
    op.alter_column(
        "vk_source_collections",
        "identity_version",
        server_default=None,
    )
    op.create_index(
        "ix_vk_source_collections_source",
        "vk_source_collections",
        ["source_id", "created_at"],
    )
    op.create_index(
        "uq_vk_source_collections_active_fingerprint",
        "vk_source_collections",
        [
            "identity_version",
            "provider_account_key",
            "source_key",
            "fingerprint",
        ],
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
        sa.Column("demand_id", UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("source_id", UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("task_revision", sa.Integer(), nullable=True),
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("source_set_revision", sa.Integer(), nullable=True),
    )
    op.add_column(
        "vk_collection_demands",
        sa.Column("snapshot_sha256", sa.String(64), nullable=True),
    )
    op.execute(
        "UPDATE vk_collection_demands SET demand_id = id WHERE demand_id IS NULL"
    )
    op.alter_column(
        "vk_collection_demands",
        "demand_id",
        nullable=False,
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
    duplicate = bind.execute(
        sa.text(
            """
            SELECT task_id, run_id
            FROM vk_collection_demands
            GROUP BY task_id, run_id
            HAVING count(*) > 1
            LIMIT 1
            """
        )
    ).first()
    if duplicate is not None:
        raise RuntimeError(
            "Cannot downgrade PR06B while a TaskRun has multiple source demands; "
            "drain or migrate source-level data first"
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
    op.drop_column("vk_source_collections", "identity_version")
    op.create_index(
        "uq_vk_source_collections_active_fingerprint",
        "vk_source_collections",
        ["provider_account_key", "source_key", "fingerprint"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'running')"),
    )
