import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

REFERENCE_TABLE = "vk_ingestion_part_references"
BATCH_TABLE = "vk_ingestion_staging_batches"


def add_publication_claims() -> None:
    _upgrade_batch_states()
    op.drop_index(
        "ix_vk_ingestion_part_references_status",
        table_name=REFERENCE_TABLE,
    )
    op.add_column(REFERENCE_TABLE, sa.Column("claim_id", UUID(as_uuid=True)))
    op.add_column(REFERENCE_TABLE, sa.Column("claimed_by", sa.String(128)))
    op.add_column(
        REFERENCE_TABLE,
        sa.Column("claim_expires_at", sa.DateTime(timezone=True)),
    )
    op.add_column(
        REFERENCE_TABLE,
        sa.Column(
            "attempts",
            sa.Integer(),
            server_default=sa.text("0"),
            nullable=False,
        ),
    )
    op.add_column(
        REFERENCE_TABLE,
        sa.Column(
            "next_attempt_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    )
    op.add_column(REFERENCE_TABLE, sa.Column("last_error", sa.String(2000)))
    op.add_column(
        REFERENCE_TABLE,
        sa.Column("published_at", sa.DateTime(timezone=True)),
    )
    op.add_column(
        REFERENCE_TABLE,
        sa.Column("quarantined_at", sa.DateTime(timezone=True)),
    )
    _create_reference_constraints()


def _upgrade_batch_states() -> None:
    op.drop_constraint(
        "ck_vk_ingestion_staging_status",
        BATCH_TABLE,
        type_="check",
    )
    op.execute(
        sa.text(
            "UPDATE vk_ingestion_staging_batches "
            "SET status = 'prepared' WHERE status = 'persisted'"
        )
    )
    op.create_check_constraint(
        "ck_vk_ingestion_staging_status",
        BATCH_TABLE,
        "status IN ('staged', 'prepared', 'published', 'failed', 'quarantined')",
    )


def _create_reference_constraints() -> None:
    op.create_check_constraint(
        "ck_vk_ingestion_part_reference_attempts",
        REFERENCE_TABLE,
        "attempts >= 0",
    )
    op.create_check_constraint(
        "ck_vk_ingestion_part_reference_claim_complete",
        REFERENCE_TABLE,
        "(claim_id IS NULL AND claimed_by IS NULL AND claim_expires_at IS NULL) "
        "OR (claim_id IS NOT NULL AND claimed_by IS NOT NULL "
        "AND claim_expires_at IS NOT NULL)",
    )
    op.create_check_constraint(
        "ck_vk_ingestion_part_reference_terminal_unclaimed",
        REFERENCE_TABLE,
        "status = 'pending' OR claim_id IS NULL",
    )
    op.create_index(
        "ix_vk_ingestion_part_references_due",
        REFERENCE_TABLE,
        ["status", "next_attempt_at", "created_at"],
    )
    op.create_index(
        "ix_vk_ingestion_part_references_claim_expiry",
        REFERENCE_TABLE,
        ["claim_expires_at"],
    )


def drop_publication_claims() -> None:
    op.drop_index(
        "ix_vk_ingestion_part_references_claim_expiry",
        table_name=REFERENCE_TABLE,
    )
    op.drop_index(
        "ix_vk_ingestion_part_references_due",
        table_name=REFERENCE_TABLE,
    )
    for constraint in (
        "ck_vk_ingestion_part_reference_terminal_unclaimed",
        "ck_vk_ingestion_part_reference_claim_complete",
        "ck_vk_ingestion_part_reference_attempts",
    ):
        op.drop_constraint(constraint, REFERENCE_TABLE, type_="check")
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
        op.drop_column(REFERENCE_TABLE, column)
    op.create_index(
        "ix_vk_ingestion_part_references_status",
        REFERENCE_TABLE,
        ["status", "created_at"],
    )
    _downgrade_batch_states()


def _downgrade_batch_states() -> None:
    op.drop_constraint(
        "ck_vk_ingestion_staging_status",
        BATCH_TABLE,
        type_="check",
    )
    op.execute(
        sa.text(
            "UPDATE vk_ingestion_staging_batches SET status = CASE "
            "WHEN status = 'prepared' THEN 'staged' "
            "WHEN status IN ('published', 'quarantined') THEN 'failed' "
            "ELSE status END"
        )
    )
    op.create_check_constraint(
        "ck_vk_ingestion_staging_status",
        BATCH_TABLE,
        "status IN ('staged', 'persisted', 'failed')",
    )
