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
    op.add_column(BATCH, sa.Column("purge_manifest", JSONB()))
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
    op.create_unique_constraint("uq_vk_ingestion_part_reference_ack_event", REFERENCE, ["ack_event_id"])
    op.create_unique_constraint("uq_vk_ingestion_part_reference_ack_receipt", REFERENCE, ["ack_receipt_id"])
    _create_evidence_constraints()


def downgrade_ack_lifecycle() -> None:
    _drop_evidence_constraints()
    op.drop_constraint("uq_vk_ingestion_part_reference_ack_receipt", REFERENCE, type_="unique")
    op.drop_constraint("uq_vk_ingestion_part_reference_ack_event", REFERENCE, type_="unique")
    for name in (
        "ack_effect_summary", "ack_source_position", "ack_received_at", "ack_applied_at",
        "ack_receipt_id", "ack_event_id",
    ):
        op.drop_column(REFERENCE, name)
    op.alter_column(PART, "wire_bytes", existing_type=sa.LargeBinary(), nullable=False)
    op.drop_column(PART, "payload_purged_at")
    op.drop_column(PART, "applied_at")
    op.alter_column(BATCH, "payload", existing_type=JSONB(), nullable=False)
    op.drop_column(BATCH, "purge_manifest")
    op.drop_column(BATCH, "payload_purged_at")
    op.drop_column(BATCH, "applied_at")
    _replace_status_constraints(extended=False)


def _create_evidence_constraints() -> None:
    op.create_check_constraint(
        "ck_vk_ingestion_staging_purge_atomic",
        BATCH,
        "status != 'payload_purged' OR (payload IS NULL AND purge_manifest IS NOT NULL "
        "AND payload_purged_at IS NOT NULL)",
    )
    op.create_check_constraint(
        "ck_vk_ingestion_part_purge_atomic",
        PART,
        "status != 'payload_purged' OR (wire_bytes IS NULL AND payload_purged_at IS NOT NULL)",
    )
    op.create_check_constraint(
        "ck_vk_ingestion_part_reference_applied_evidence",
        REFERENCE,
        "status != 'applied' OR (ack_event_id IS NOT NULL AND ack_receipt_id IS NOT NULL "
        "AND ack_applied_at IS NOT NULL AND ack_received_at IS NOT NULL "
        "AND ack_source_position IS NOT NULL AND ack_effect_summary IS NOT NULL)",
    )


def _drop_evidence_constraints() -> None:
    op.drop_constraint("ck_vk_ingestion_part_reference_applied_evidence", REFERENCE, type_="check")
    op.drop_constraint("ck_vk_ingestion_part_purge_atomic", PART, type_="check")
    op.drop_constraint("ck_vk_ingestion_staging_purge_atomic", BATCH, type_="check")


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
    op.create_check_constraint("ck_vk_ingestion_staging_status", BATCH, _status_sql(batch))
    op.create_check_constraint("ck_vk_ingestion_part_status", PART, _status_sql(part))
    op.create_check_constraint("ck_vk_ingestion_part_reference_status", REFERENCE, _status_sql(reference))


def _status_sql(values: list[str]) -> str:
    return "status IN (" + ",".join(f"'{value}'" for value in values) + ")"
