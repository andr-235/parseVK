import sqlalchemy as sa
from alembic import op

revision = "20260608_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS im_messages (
            id BIGSERIAL NOT NULL,
            messenger VARCHAR(32) NOT NULL,
            external_id VARCHAR(256) NOT NULL,
            chat_external_id VARCHAR(256) NOT NULL,
            chat_name TEXT,
            author TEXT,
            text TEXT,
            content_url TEXT,
            content_type VARCHAR(128),
            metadata_raw JSONB,
            created_at TIMESTAMPTZ,
            ingested_at TIMESTAMPTZ NOT NULL,
            raw JSONB,
            PRIMARY KEY (id)
        )
    """))
    op.execute("CREATE INDEX IF NOT EXISTS ix_im_messages_messenger_chat_created "
               "ON im_messages (messenger, chat_external_id, created_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_im_messages_messenger_created "
               "ON im_messages (messenger, created_at)")

    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS im_groups (
            id BIGSERIAL NOT NULL,
            messenger VARCHAR(32) NOT NULL,
            external_chat_id VARCHAR(256) NOT NULL,
            name TEXT,
            category VARCHAR(128),
            raw JSONB,
            first_seen_at TIMESTAMPTZ NOT NULL,
            last_seen_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (id),
            CONSTRAINT uq_im_groups_messenger_chat UNIQUE (messenger, external_chat_id)
        )
    """))

    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS im_task_runs (
            id UUID NOT NULL,
            task_id BIGINT NOT NULL,
            owner_user_id VARCHAR(128) NOT NULL,
            run_id VARCHAR(128) NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            scope VARCHAR(32) NOT NULL,
            mode VARCHAR(64) NOT NULL,
            messenger VARCHAR(32) NOT NULL,
            group_ids JSONB,
            post_limit INTEGER,
            started_at TIMESTAMPTZ,
            finished_at TIMESTAMPTZ,
            processed_items INTEGER NOT NULL DEFAULT 0,
            total_items INTEGER NOT NULL DEFAULT 0,
            last_error TEXT,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (id),
            CONSTRAINT uq_im_task_runs_task_id UNIQUE (task_id)
        )
    """))
    op.execute("CREATE INDEX IF NOT EXISTS ix_im_task_runs_task_id ON im_task_runs (task_id)")

    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS processed_events (
            id BIGSERIAL NOT NULL,
            consumer_name TEXT NOT NULL,
            event_id UUID NOT NULL,
            event_type TEXT NOT NULL,
            processed_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (id),
            CONSTRAINT uq_processed_events_consumer_event UNIQUE (consumer_name, event_id)
        )
    """))
    op.execute("CREATE INDEX IF NOT EXISTS ix_processed_events_consumer_event "
               "ON processed_events (consumer_name, event_id)")

    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS outbox_events (
            id UUID NOT NULL,
            event_type TEXT NOT NULL,
            event_version INTEGER NOT NULL DEFAULT 1,
            aggregate_type TEXT NOT NULL,
            aggregate_id TEXT NOT NULL,
            correlation_id TEXT,
            dedupe_key TEXT,
            payload JSONB NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            attempts INTEGER NOT NULL DEFAULT 0,
            next_attempt_at TIMESTAMPTZ NOT NULL,
            locked_at TIMESTAMPTZ,
            published_at TIMESTAMPTZ,
            last_error TEXT,
            created_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (id)
        )
    """))
    op.execute("CREATE INDEX IF NOT EXISTS ix_outbox_events_status_next_attempt "
               "ON outbox_events (status, next_attempt_at)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_outbox_events_dedupe_key "
               "ON outbox_events (dedupe_key) WHERE dedupe_key IS NOT NULL")


def downgrade() -> None:
    op.drop_table("outbox_events")
    op.drop_table("processed_events")
    op.drop_table("im_task_runs")
    op.drop_table("im_groups")
    op.drop_table("im_messages")
