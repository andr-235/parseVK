import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID


def _versions() -> list[sa.Column]:
    return [
        sa.Column("staging_schema_version", sa.Integer(), nullable=False),
        sa.Column("packing_version", sa.Integer(), nullable=False),
        sa.Column("event_contract_version", sa.Integer(), nullable=False),
    ]


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    ]


def create_part_tables() -> None:
    op.create_table(
        "vk_ingestion_staging_parts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("batch_id", UUID(as_uuid=True), nullable=False),
        sa.Column("part_kind", sa.String(16), nullable=False),
        sa.Column("part_index", sa.Integer(), nullable=False),
        sa.Column("part_count", sa.Integer(), nullable=False),
        *_versions(),
        sa.Column("item_manifest", JSONB(), nullable=False),
        sa.Column("author_manifest", JSONB(), nullable=False),
        sa.Column("prepared_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("part_digest", sa.String(64), nullable=False),
        sa.Column("wire_bytes", sa.LargeBinary(), nullable=False),
        sa.Column("wire_bytes_count", sa.Integer(), nullable=False),
        sa.Column("wire_digest", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), server_default="prepared", nullable=False),
        *_timestamps(),
        sa.CheckConstraint(
            "part_kind IN ('post', 'comments')",
            name="ck_vk_ingestion_part_kind",
        ),
        sa.CheckConstraint(
            "part_count > 0 AND part_index >= 0 AND part_index < part_count",
            name="ck_vk_ingestion_part_position",
        ),
        sa.CheckConstraint(
            "staging_schema_version > 0 AND packing_version > 0 "
            "AND event_contract_version > 0",
            name="ck_vk_ingestion_part_versions",
        ),
        sa.CheckConstraint(
            "wire_bytes_count > 0 AND wire_bytes_count <= 786432",
            name="ck_vk_ingestion_part_wire_bytes",
        ),
        sa.CheckConstraint(
            "status IN ('prepared', 'published', 'failed', 'quarantined')",
            name="ck_vk_ingestion_part_status",
        ),
        sa.ForeignKeyConstraint(
            ["batch_id"],
            ["vk_ingestion_staging_batches.id"],
            ondelete="RESTRICT",
        ),
        sa.UniqueConstraint(
            "batch_id",
            "part_kind",
            "staging_schema_version",
            "packing_version",
            "event_contract_version",
            "part_index",
            name="uq_vk_ingestion_part_identity",
        ),
    )
    op.create_index(
        "ix_vk_ingestion_parts_batch",
        "vk_ingestion_staging_parts",
        ["batch_id", "part_index"],
    )
    op.create_index(
        "ix_vk_ingestion_parts_status",
        "vk_ingestion_staging_parts",
        ["status", "prepared_at"],
    )
    _create_references()


def _create_references() -> None:
    op.create_table(
        "vk_ingestion_part_references",
        sa.Column("part_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("status", sa.String(32), server_default="pending", nullable=False),
        *_timestamps(),
        sa.CheckConstraint(
            "status IN ('pending', 'published', 'failed', 'quarantined')",
            name="ck_vk_ingestion_part_reference_status",
        ),
        sa.ForeignKeyConstraint(
            ["part_id"],
            ["vk_ingestion_staging_parts.id"],
            ondelete="RESTRICT",
        ),
    )
    op.create_index(
        "ix_vk_ingestion_part_references_status",
        "vk_ingestion_part_references",
        ["status", "created_at"],
    )


def drop_part_tables() -> None:
    op.drop_table("vk_ingestion_part_references")
    op.drop_table("vk_ingestion_staging_parts")
