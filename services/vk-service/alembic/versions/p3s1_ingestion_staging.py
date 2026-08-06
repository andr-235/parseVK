"""Add durable VK ingestion staging batches.

Revision ID: p3s1_ingestion_staging
Revises: p2h4_execution_plan_cleanup
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "p3s1_ingestion_staging"
down_revision: str | None = "p2h4_execution_plan_cleanup"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "vk_ingestion_staging_batches",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("execution_id", UUID(as_uuid=True), nullable=False),
        # Attempt UUID is immutable provenance only. Deliberately no FK: staged
        # recovery data must outlive execution-attempt retention and cleanup.
        sa.Column("staged_by_attempt_id", UUID(as_uuid=True), nullable=False),
        sa.Column("staged_by_fencing_token", sa.BigInteger(), nullable=False),
        sa.Column("source_kind", sa.String(length=32), nullable=False),
        sa.Column("owner_id", sa.BigInteger(), nullable=False),
        sa.Column("post_id", sa.BigInteger(), nullable=False),
        sa.Column("page_offset", sa.Integer(), nullable=False),
        sa.Column("payload_digest", sa.String(length=64), nullable=False),
        sa.Column("payload_bytes", sa.Integer(), nullable=False),
        sa.Column("payload", JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="staged", nullable=False),
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
        sa.CheckConstraint(
            "page_offset >= 0", name="ck_vk_ingestion_staging_page_offset"
        ),
        sa.CheckConstraint(
            "payload_bytes >= 2", name="ck_vk_ingestion_staging_payload_bytes"
        ),
        sa.CheckConstraint(
            "status IN ('staged', 'persisted', 'failed')",
            name="ck_vk_ingestion_staging_status",
        ),
        sa.ForeignKeyConstraint(
            ["execution_id"], ["vk_executions.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "execution_id",
            "source_kind",
            "owner_id",
            "post_id",
            "page_offset",
            name="uq_vk_ingestion_staging_position",
        ),
    )
    op.create_index(
        "ix_vk_ingestion_staging_execution",
        "vk_ingestion_staging_batches",
        ["execution_id", "page_offset"],
        unique=False,
    )
    op.create_index(
        "ix_vk_ingestion_staging_status",
        "vk_ingestion_staging_batches",
        ["status", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_vk_ingestion_staging_status",
        table_name="vk_ingestion_staging_batches",
    )
    op.drop_index(
        "ix_vk_ingestion_staging_execution",
        table_name="vk_ingestion_staging_batches",
    )
    op.drop_table("vk_ingestion_staging_batches")
