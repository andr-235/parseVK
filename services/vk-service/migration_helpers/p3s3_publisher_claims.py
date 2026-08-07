import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

TABLE = "vk_ingestion_part_references"


def add_publication_claims() -> None:
    op.drop_index("ix_vk_ingestion_part_references_status", table_name=TABLE)
    op.add_column(TABLE, sa.Column("claim_id", UUID(as_uuid=True)))
    op.add_column(TABLE, sa.Column("claimed_by", sa.String(128)))
    op.add_column(TABLE, sa.Column("claim_expires_at", sa.DateTime(timezone=True)))
    op.add_column(
        TABLE,
        sa.Column("attempts", sa.Integer(), server_default=sa.text("0"), nullable=False),
    )
    op.add_column(
        TABLE,
        sa.Column(
            "next_attempt_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    )
    op.add_column(TABLE, sa.Column("last_error", sa.String(2000)))
    op.add_column(TABLE, sa.Column("published_at", sa.DateTime(timezone=True)))
    op.add_column(TABLE, sa.Column("quarantined_at", sa.DateTime(timezone=True)))
    op.create_check_constraint(
        "ck_vk_ingestion_part_reference_attempts",
        TABLE,
        "attempts >= 0",
    )
    op.create_check_constraint(
        "ck_vk_ingestion_part_reference_claim_complete",
        TABLE,
        "(claim_id IS NULL AND claimed_by IS NULL AND claim_expires_at IS NULL) "
        "OR (claim_id IS NOT NULL AND claimed_by IS NOT NULL "
        "AND claim_expires_at IS NOT NULL)",
    )
    op.create_check_constraint(
        "ck_vk_ingestion_part_reference_terminal_unclaimed",
        TABLE,
        "status = 'pending' OR claim_id IS NULL",
    )
    op.create_index(
        "ix_vk_ingestion_part_references_due",
        TABLE,
        ["status", "next_attempt_at", "created_at"],
    )
    op.create_index(
        "ix_vk_ingestion_part_references_claim_expiry",
        TABLE,
        ["claim_expires_at"],
    )


def drop_publication_claims() -> None:
    op.drop_index("ix_vk_ingestion_part_references_claim_expiry", table_name=TABLE)
    op.drop_index("ix_vk_ingestion_part_references_due", table_name=TABLE)
    op.drop_constraint(
        "ck_vk_ingestion_part_reference_terminal_unclaimed",
        TABLE,
        type_="check",
    )
    op.drop_constraint(
        "ck_vk_ingestion_part_reference_claim_complete",
        TABLE,
        type_="check",
    )
    op.drop_constraint(
        "ck_vk_ingestion_part_reference_attempts",
        TABLE,
        type_="check",
    )
    for column in (
        "quarantined_at",
        "published_at",
        "last_error",
        "next_attempt_at",
        "attempts",
        "claim_expires_at",
        "claimed_by",
        "claim_id",
    ):
        op.drop_column(TABLE, column)
    op.create_index(
        "ix_vk_ingestion_part_references_status",
        TABLE,
        ["status", "created_at"],
    )
