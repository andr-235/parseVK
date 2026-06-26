"""create im_keywords, im_user_notifier_state tables + pg_trgm index

Revision ID: 20260626_0001
Revises: 20260623_0001
Create Date: 2026-06-26 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = "20260626_0001"
down_revision = "20260623_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS im_keywords (
            id BIGSERIAL NOT NULL,
            messenger VARCHAR(32) NOT NULL,
            user_id VARCHAR(128) NOT NULL,
            keyword TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (id),
            CONSTRAINT uq_im_keywords_messenger_user_keyword UNIQUE (messenger, user_id, keyword)
        )
    """))
    op.execute("CREATE INDEX IF NOT EXISTS ix_im_keywords_user_messenger "
               "ON im_keywords (user_id, messenger)")

    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS im_user_notifier_state (
            id BIGSERIAL NOT NULL,
            user_id VARCHAR(128) NOT NULL,
            messenger VARCHAR(32) NOT NULL,
            last_seen_message_id BIGINT,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (id),
            CONSTRAINT uq_im_user_notifier_state_user_messenger UNIQUE (user_id, messenger)
        )
    """))

    op.execute("CREATE INDEX IF NOT EXISTS ix_im_messages_text_trgm "
               "ON im_messages USING gin (text gin_trgm_ops)")


def downgrade() -> None:
    op.drop_table("im_user_notifier_state")
    op.drop_table("im_keywords")
    op.execute("DROP INDEX IF EXISTS ix_im_messages_text_trgm")
