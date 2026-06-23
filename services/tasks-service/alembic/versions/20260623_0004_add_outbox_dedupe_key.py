"""add dedupe_key to outbox_events"""

import sqlalchemy as sa
from alembic import op

revision = "20260623_0004"
down_revision = "20260622_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("outbox_events", sa.Column("dedupe_key", sa.Text(), nullable=True))
    op.create_index(
        "uq_outbox_events_dedupe_key",
        "outbox_events",
        ["dedupe_key"],
        unique=True,
        postgresql_where=sa.text("dedupe_key IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_outbox_events_dedupe_key", table_name="outbox_events", postgresql_where=sa.text("dedupe_key IS NOT NULL"))
    op.drop_column("outbox_events", "dedupe_key")
