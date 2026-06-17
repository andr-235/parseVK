from datetime import datetime, timezone
from uuid import uuid4

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "20260608_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "im_messages",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("messenger", sa.String(32), nullable=False),
        sa.Column("external_id", sa.String(256), nullable=False),
        sa.Column("chat_external_id", sa.String(256), nullable=False),
        sa.Column("chat_name", sa.Text(), nullable=True),
        sa.Column("author", sa.Text(), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("content_url", sa.Text(), nullable=True),
        sa.Column("content_type", sa.String(128), nullable=True),
        sa.Column("metadata_raw", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ingested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("raw", JSONB(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_im_messages_messenger_chat_created", "im_messages", ["messenger", "chat_external_id", "created_at"])
    op.create_index("ix_im_messages_messenger_created", "im_messages", ["messenger", "created_at"])

    op.create_table(
        "im_groups",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("messenger", sa.String(32), nullable=False),
        sa.Column("external_chat_id", sa.String(256), nullable=False),
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column("category", sa.String(128), nullable=True),
        sa.Column("raw", JSONB(), nullable=True),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("messenger", "external_chat_id", name="uq_im_groups_messenger_chat"),
    )

    op.create_table(
        "im_task_runs",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", sa.BigInteger(), nullable=False),
        sa.Column("owner_user_id", sa.String(128), nullable=False),
        sa.Column("run_id", sa.String(128), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("scope", sa.String(32), nullable=False),
        sa.Column("mode", sa.String(64), nullable=False),
        sa.Column("messenger", sa.String(32), nullable=False),
        sa.Column("group_ids", JSONB(), nullable=True),
        sa.Column("post_limit", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("processed_items", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_items", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_id", name="uq_im_task_runs_task_id"),
    )
    op.create_index("ix_im_task_runs_task_id", "im_task_runs", ["task_id"])

    op.create_table(
        "processed_events",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("consumer_name", sa.Text(), nullable=False),
        sa.Column("event_id", UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.Text(), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("consumer_name", "event_id", name="uq_processed_events_consumer_event"),
    )
    op.create_index("ix_processed_events_consumer_event", "processed_events", ["consumer_name", "event_id"])

    op.create_table(
        "outbox_events",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.Text(), nullable=False),
        sa.Column("event_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("aggregate_type", sa.Text(), nullable=False),
        sa.Column("aggregate_id", sa.Text(), nullable=False),
        sa.Column("correlation_id", sa.Text(), nullable=True),
        sa.Column("dedupe_key", sa.Text(), nullable=True),
        sa.Column("payload", JSONB(), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_outbox_events_status_next_attempt", "outbox_events", ["status", "next_attempt_at"])
    op.create_index("uq_outbox_events_dedupe_key", "outbox_events", ["dedupe_key"], unique=True, postgresql_where=sa.text("dedupe_key IS NOT NULL"))


def downgrade() -> None:
    op.drop_table("outbox_events")
    op.drop_table("processed_events")
    op.drop_table("im_task_runs")
    op.drop_table("im_groups")
    op.drop_table("im_messages")
