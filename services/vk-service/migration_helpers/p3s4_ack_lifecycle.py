import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

BATCH = "vk_ingestion_staging_batches"
PART = "vk_ingestion_staging_parts"
REFERENCE = "vk_ingestion_part_references"


def upgrade_ack_lifecycle() -> None:
    _replace_status_constraints(extended=True)
    op.add_column(BATCH, sa.Column("applied_at", sa.DateTime(timezone=True)))
    op.add_column(BATCH, sa.Column("payload_purged_at", sa.DateTime(timezone=True)))
    op.alter_column(BATCH, "payload", existing_type=JSONB(), nullable=True)
    op.add_column(PART, sa.Column("applied_at", sa.DateTime(timezone=True)))
    op.add_column(PART, sa.Column("payload_purged_at", sa.DateTime(timezone=True)))
    op.alter_column(PART, "wire_bytes", existing_type=sa.LargeBinary(), nullable=True)
    op.add_column(REFERENCE, sa.Column("ack_event_id", UUID(as_uuid=True)))
    op.add_column(REFERENCE, sa.Column("ack_receipt_id", UUID(as_uuid=True)))
    op.add_column(REFERENCE, sa.Column("ack_applied_at", sa.DateTime(timezone=True)))
    op.add_column(REFERENCE, sa.Column("ack_received_at", sa.DateTime(timezone=True)))
    op.add_column(REFERENCE, sa.Column("ack_source_position", JSONB()))
    op.add_column(REFERENCE, sa.Column("ack_effect_summary", JSONB()))
    op.create_unique_constraint(
        "uq_vk_ingestion_part_reference_ack_event", REFERENCE, ["ack_event_id"]
    )
    op.create_unique_constraint(
        "uq_vk_ingestion_part_reference_ack_receipt", REFERENCE, ["ack_receipt_id"]
    )
    op.drop_constraint(
        "vk_ingestion_staging_batches_execution_id_fkey", BATCH, type_="foreignkey"
    )
    op.create_foreign_key(
        "fk_vk_ingestion_staging_execution_retained",
        BATCH,
        "vk_executions",
        ["execution_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade_ack_lifecycle() -> None:
    op.drop_constraint(
        "fk_vk_ingestion_staging_execution_retained", BATCH, type_="foreignkey"
    )
    op.create_foreign_key(
        "vk_ingestion_staging_batches_execution_id_fkey",
        BATCH,
        "vk_executions",
        ["execution_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.drop_constraint(
        "uq_vk_ingestion_part_reference_ack_receipt", REFERENCE, type_="unique"
    )
    op.drop_constraint(
        "uq_vk_ingestion_part_reference_ack_event", REFERENCE, type_="unique"
    )
    for name in (
        "ack_effect_summary",
        "ack_source_position",
        "ack_received_at",
        "ack_applied_at",
        "ack_receipt_id",
        "ack_event_id",
    ):
        op.drop_column(REFERENCE, name)
    op.alter_column(PART, "wire_bytes", existing_type=sa.LargeBinary(), nullable=False)
    op.drop_column(PART, "payload_purged_at")
    op.drop_column(PART, "applied_at")
    op.alter_column(BATCH, "payload", existing_type=JSONB(), nullable=False)
    op.drop_column(BATCH, "payload_purged_at")
    op.drop_column(BATCH, "applied_at")
    _replace_status_constraints(extended=False)


def _replace_status_constraints(*, extended: bool) -> None:
    for table, constraint in (
        (BATCH, "ck_vk_ingestion_staging_status"),
        (PART, "ck_vk_ingestion_part_status"),
        (REFERENCE, "ck_vk_ingestion_part_reference_status"),
    ):
        op.drop_constraint(constraint, table, type_="check")
    batch = ["staged", "prepared", "published", "failed", "quarantined"]
    part = ["prepared", "published", "failed", "quarantined"]
    reference = ["pending", "published", "failed", "quarantined"]
    if extended:
        batch[3:3] = ["applied", "payload_purged"]
        part[2:2] = ["applied", "payload_purged"]
        reference[2:2] = ["applied"]
    op.create_check_constraint(
        "ck_vk_ingestion_staging_status", BATCH, _status_sql(batch)
    )
    op.create_check_constraint("ck_vk_ingestion_part_status", PART, _status_sql(part))
    op.create_check_constraint(
        "ck_vk_ingestion_part_reference_status", REFERENCE, _status_sql(reference)
    )


def _status_sql(values: list[str]) -> str:
    return "status IN (" + ",".join(f"'{value}'" for value in values) + ")"
