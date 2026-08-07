"""Add deterministic ingestion parts and oversized diagnostics.

Revision ID: p3s2_ingestion_parts
Revises: p3s1_ingestion_staging
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "p3s2_ingestion_parts"
down_revision: str | None = "p3s1_ingestion_staging"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "vk_ingestion_staging_parts",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("batch_id", UUID(as_uuid=True), nullable=False),
        sa.Column("part_kind", sa.String(16), nullable=False),
        sa.Column("part_index", sa.Integer(), nullable=False),
        sa.Column("part_count", sa.Integer(), nullable=False),
        sa.Column("staging_schema_version", sa.Integer(), nullable=False),
        sa.Column("packing_version", sa.Integer(), nullable=False),
        sa.Column("event_contract_version", sa.Integer(), nullable=False),
        sa.Column("item_manifest", JSONB(), nullable=False),
        sa.Column("author_manifest", JSONB(), nullable=False),
        sa.Column("prepared_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("part_digest", sa.String(64), nullable=False),
        sa.Column("wire_bytes", sa.LargeBinary(), nullable=False),
        sa.Column("wire_bytes_count", sa.Integer(), nullable=False),
        sa.Column("wire_digest", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), server_default="prepared", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("part_kind IN ('post', 'comments')", name="ck_vk_ingestion_part_kind"),
        sa.CheckConstraint("part_count > 0 AND part_index >= 0 AND part_index < part_count", name="ck_vk_ingestion_part_position"),
        sa.CheckConstraint("staging_schema_version > 0 AND packing_version > 0 AND event_contract_version > 0", name="ck_vk_ingestion_part_versions"),
        sa.CheckConstraint("wire_bytes_count > 0 AND wire_bytes_count <= 786432", name="ck_vk_ingestion_part_wire_bytes"),
        sa.CheckConstraint("status IN ('prepared', 'published', 'failed', 'quarantined')", name="ck_vk_ingestion_part_status"),
        sa.ForeignKeyConstraint(["batch_id"], ["vk_ingestion_staging_batches.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("batch_id", "part_kind", "staging_schema_version", "packing_version", "event_contract_version", "part_index", name="uq_vk_ingestion_part_identity"),
    )
    op.create_index("ix_vk_ingestion_parts_batch", "vk_ingestion_staging_parts", ["batch_id", "part_index"])
    op.create_index("ix_vk_ingestion_parts_status", "vk_ingestion_staging_parts", ["status", "prepared_at"])

    op.create_table(
        "vk_ingestion_part_references",
        sa.Column("part_id", UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(32), server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("status IN ('pending', 'published', 'failed', 'quarantined')", name="ck_vk_ingestion_part_reference_status"),
        sa.ForeignKeyConstraint(["part_id"], ["vk_ingestion_staging_parts.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("part_id"),
    )
    op.create_index("ix_vk_ingestion_part_references_status", "vk_ingestion_part_references", ["status", "created_at"])

    op.create_table(
        "vk_ingestion_oversized_diagnostics",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("batch_id", UUID(as_uuid=True), nullable=False),
        sa.Column("item_kind", sa.String(16), nullable=False),
        sa.Column("item_identity", sa.String(128), nullable=False),
        sa.Column("staging_schema_version", sa.Integer(), nullable=False),
        sa.Column("packing_version", sa.Integer(), nullable=False),
        sa.Column("event_contract_version", sa.Integer(), nullable=False),
        sa.Column("wire_bytes_count", sa.Integer(), nullable=False),
        sa.Column("hard_limit_bytes", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(32), server_default="quarantined", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("item_kind IN ('post', 'comment')", name="ck_vk_ingestion_oversized_item_kind"),
        sa.CheckConstraint("wire_bytes_count > hard_limit_bytes AND hard_limit_bytes > 0", name="ck_vk_ingestion_oversized_bytes"),
        sa.CheckConstraint("status = 'quarantined'", name="ck_vk_ingestion_oversized_status"),
        sa.ForeignKeyConstraint(["batch_id"], ["vk_ingestion_staging_batches.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("batch_id", "item_kind", "item_identity", "staging_schema_version", "packing_version", "event_contract_version", name="uq_vk_ingestion_oversized_identity"),
    )
    op.create_index("ix_vk_ingestion_oversized_batch", "vk_ingestion_oversized_diagnostics", ["batch_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_vk_ingestion_oversized_batch", table_name="vk_ingestion_oversized_diagnostics")
    op.drop_table("vk_ingestion_oversized_diagnostics")
    op.drop_index("ix_vk_ingestion_part_references_status", table_name="vk_ingestion_part_references")
    op.drop_table("vk_ingestion_part_references")
    op.drop_index("ix_vk_ingestion_parts_status", table_name="vk_ingestion_staging_parts")
    op.drop_index("ix_vk_ingestion_parts_batch", table_name="vk_ingestion_staging_parts")
    op.drop_table("vk_ingestion_staging_parts")
