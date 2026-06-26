"""create monitoring_groups table

Revision ID: 20260626_0002
Revises: 20260626_0001
Create Date: 2026-06-26 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = "20260626_0002"
down_revision = "20260626_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS monitoring_groups (
            id BIGSERIAL NOT NULL,
            messenger VARCHAR(32) NOT NULL,
            chat_id VARCHAR(256) NOT NULL,
            name TEXT NOT NULL,
            category VARCHAR(128),
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (id),
            CONSTRAINT uq_monitoring_groups_messenger_chat UNIQUE (messenger, chat_id)
        )
    """))


def downgrade() -> None:
    op.drop_table("monitoring_groups")
