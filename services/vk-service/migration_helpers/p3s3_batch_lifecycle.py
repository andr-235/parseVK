import sqlalchemy as sa
from alembic import op

TABLE = "vk_ingestion_staging_batches"


def upgrade_batch_states() -> None:
    op.drop_constraint(
        "ck_vk_ingestion_staging_status",
        TABLE,
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
        TABLE,
        "status IN ('staged', 'prepared', 'published', 'failed', 'quarantined')",
    )


def downgrade_batch_states() -> None:
    op.drop_constraint(
        "ck_vk_ingestion_staging_status",
        TABLE,
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
        TABLE,
        "status IN ('staged', 'persisted', 'failed')",
    )
