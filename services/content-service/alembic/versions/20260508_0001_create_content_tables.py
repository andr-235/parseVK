"""create content tables"""

import sqlalchemy as sa
from alembic import op

revision = "20260508_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "content_groups",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("vk_group_id", sa.BigInteger(), nullable=False),
        sa.Column("screen_name", sa.Text(), nullable=True),
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column("last_collected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vk_group_id"),
    )
    op.create_table(
        "content_authors",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("vk_author_id", sa.BigInteger(), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("display_name", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vk_author_id"),
    )
    op.create_table(
        "content_posts",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("external_key", sa.Text(), nullable=False),
        sa.Column("vk_owner_id", sa.BigInteger(), nullable=False),
        sa.Column("vk_post_id", sa.BigInteger(), nullable=False),
        sa.Column("vk_group_id", sa.BigInteger(), nullable=True),
        sa.Column("author_vk_id", sa.BigInteger(), nullable=True),
        sa.Column("date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("comments_count", sa.Integer(), nullable=False),
        sa.Column("last_collected_task_id", sa.BigInteger(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("external_key"),
    )
    op.create_index("ix_content_posts_date_id", "content_posts", ["date", "id"])
    op.create_table(
        "content_comments",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("external_key", sa.Text(), nullable=False),
        sa.Column("post_external_key", sa.Text(), nullable=False),
        sa.Column("vk_owner_id", sa.BigInteger(), nullable=False),
        sa.Column("vk_post_id", sa.BigInteger(), nullable=False),
        sa.Column("vk_comment_id", sa.BigInteger(), nullable=False),
        sa.Column("author_vk_id", sa.BigInteger(), nullable=True),
        sa.Column("date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("last_collected_task_id", sa.BigInteger(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("external_key"),
    )
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


def downgrade() -> None:
    op.drop_index("ix_processed_events_consumer_event", table_name="processed_events")
    op.drop_table("processed_events")
    op.drop_table("content_comments")
    op.drop_index("ix_content_posts_date_id", table_name="content_posts")
    op.drop_table("content_posts")
    op.drop_table("content_authors")
    op.drop_table("content_groups")
