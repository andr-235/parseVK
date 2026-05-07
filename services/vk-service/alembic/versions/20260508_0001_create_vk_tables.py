"""create vk tables"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260508_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vk_groups",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("vk_group_id", sa.BigInteger(), nullable=False),
        sa.Column("screen_name", sa.Text(), nullable=True),
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column("is_closed", sa.Boolean(), nullable=True),
        sa.Column("raw", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vk_group_id"),
    )
    op.create_table(
        "vk_authors",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("vk_author_id", sa.BigInteger(), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("display_name", sa.Text(), nullable=True),
        sa.Column("raw", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vk_author_id"),
    )
    op.create_table(
        "vk_posts",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("vk_post_id", sa.BigInteger(), nullable=False),
        sa.Column("vk_owner_id", sa.BigInteger(), nullable=False),
        sa.Column("vk_group_id", sa.BigInteger(), nullable=True),
        sa.Column("author_vk_id", sa.BigInteger(), nullable=True),
        sa.Column("date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("raw", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("first_task_id", sa.BigInteger(), nullable=False),
        sa.Column("last_task_id", sa.BigInteger(), nullable=False),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vk_owner_id", "vk_post_id", name="uq_vk_posts_owner_post"),
    )
    op.create_index("ix_vk_posts_group_date", "vk_posts", ["vk_group_id", "date"])
    op.create_table(
        "vk_comments",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("vk_comment_id", sa.BigInteger(), nullable=False),
        sa.Column("vk_owner_id", sa.BigInteger(), nullable=False),
        sa.Column("vk_post_id", sa.BigInteger(), nullable=False),
        sa.Column("author_vk_id", sa.BigInteger(), nullable=True),
        sa.Column("date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("raw", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("first_task_id", sa.BigInteger(), nullable=False),
        sa.Column("last_task_id", sa.BigInteger(), nullable=False),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vk_owner_id", "vk_post_id", "vk_comment_id", name="uq_vk_comments_owner_post_comment"),
    )
    op.create_index("ix_vk_comments_owner_post", "vk_comments", ["vk_owner_id", "vk_post_id"])
    op.create_table(
        "vk_task_runs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("task_id", sa.BigInteger(), nullable=False),
        sa.Column("owner_user_id", sa.String(length=128), nullable=False),
        sa.Column("run_id", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("scope", sa.String(length=32), nullable=False),
        sa.Column("mode", sa.String(length=64), nullable=False),
        sa.Column("group_ids", postgresql.ARRAY(sa.BigInteger()), nullable=False),
        sa.Column("post_limit", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("processed_items", sa.Integer(), nullable=False),
        sa.Column("total_items", sa.Integer(), nullable=False),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_id", name="uq_vk_task_runs_task_id"),
    )
    op.create_index("ix_vk_task_runs_task_id", "vk_task_runs", ["task_id"])
    op.create_table(
        "processed_events",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("consumer_name", sa.Text(), nullable=False),
        sa.Column("event_id", sa.UUID(), nullable=False),
        sa.Column("event_type", sa.Text(), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("consumer_name", "event_id", name="uq_processed_events_consumer_event"),
    )
    op.create_index("ix_processed_events_consumer_event", "processed_events", ["consumer_name", "event_id"])
    op.create_table(
        "outbox_events",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("event_type", sa.Text(), nullable=False),
        sa.Column("event_version", sa.Integer(), nullable=False),
        sa.Column("aggregate_type", sa.Text(), nullable=False),
        sa.Column("aggregate_id", sa.Text(), nullable=False),
        sa.Column("correlation_id", sa.Text(), nullable=True),
        sa.Column("dedupe_key", sa.Text(), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_outbox_events_status_next_attempt", "outbox_events", ["status", "next_attempt_at"])
    op.create_index(
        "uq_outbox_events_dedupe_key",
        "outbox_events",
        ["dedupe_key"],
        unique=True,
        postgresql_where=sa.text("dedupe_key IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_outbox_events_dedupe_key", table_name="outbox_events", postgresql_where=sa.text("dedupe_key IS NOT NULL"))
    op.drop_index("ix_outbox_events_status_next_attempt", table_name="outbox_events")
    op.drop_table("outbox_events")
    op.drop_index("ix_processed_events_consumer_event", table_name="processed_events")
    op.drop_table("processed_events")
    op.drop_index("ix_vk_task_runs_task_id", table_name="vk_task_runs")
    op.drop_table("vk_task_runs")
    op.drop_index("ix_vk_comments_owner_post", table_name="vk_comments")
    op.drop_table("vk_comments")
    op.drop_index("ix_vk_posts_group_date", table_name="vk_posts")
    op.drop_table("vk_posts")
    op.drop_table("vk_authors")
    op.drop_table("vk_groups")
