import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID


def create_diagnostic_table() -> None:
    op.create_table(
        "vk_ingestion_oversized_diagnostics",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("batch_id", UUID(as_uuid=True), nullable=False),
        sa.Column("item_kind", sa.String(16), nullable=False),
        sa.Column("item_identity", sa.String(128), nullable=False),
        sa.Column("staging_schema_version", sa.Integer(), nullable=False),
        sa.Column("packing_version", sa.Integer(), nullable=False),
        sa.Column("event_contract_version", sa.Integer(), nullable=False),
        sa.Column("wire_bytes_count", sa.Integer(), nullable=False),
        sa.Column("hard_limit_bytes", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.String(32),
            server_default="quarantined",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "item_kind IN ('post', 'comment')",
            name="ck_vk_ingestion_oversized_item_kind",
        ),
        sa.CheckConstraint(
            "wire_bytes_count > hard_limit_bytes AND hard_limit_bytes > 0",
            name="ck_vk_ingestion_oversized_bytes",
        ),
        sa.CheckConstraint(
            "status = 'quarantined'",
            name="ck_vk_ingestion_oversized_status",
        ),
        sa.UniqueConstraint(
            "batch_id",
            "item_kind",
            "item_identity",
            "staging_schema_version",
            "packing_version",
            "event_contract_version",
            name="uq_vk_ingestion_oversized_identity",
        ),
    )
    op.create_index(
        "ix_vk_ingestion_oversized_batch",
        "vk_ingestion_oversized_diagnostics",
        ["batch_id", "created_at"],
    )


def drop_diagnostic_table() -> None:
    op.drop_table("vk_ingestion_oversized_diagnostics")
