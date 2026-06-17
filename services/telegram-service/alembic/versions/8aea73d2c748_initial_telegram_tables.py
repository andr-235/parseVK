"""initial telegram tables

Revision ID: 8aea73d2c748
Revises: 
Create Date: 2026-06-17 20:46:33.501331

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '8aea73d2c748'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. user
    op.create_table(
        "user",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("bot", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("scam", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("premium", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("first_name", sa.Text(), nullable=True),
        sa.Column("last_name", sa.Text(), nullable=True),
        sa.Column("username", sa.String(length=32), nullable=True),
        sa.Column("phone", sa.Text(), nullable=True),
        sa.Column("upd_date", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    # 2. message
    op.create_table(
        "message",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("message_id", sa.BigInteger(), nullable=False),
        sa.Column("peer_id", sa.BigInteger(), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("from_id", sa.BigInteger(), nullable=True),
        sa.Column("forwarded", sa.Boolean(), nullable=True, server_default=sa.false()),
        sa.Column("reply_to", sa.BigInteger(), nullable=True),
        sa.Column("media", sa.Boolean(), nullable=True, server_default=sa.false()),
        sa.Column("keywords", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # 3. group
    op.create_table(
        "group",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("group_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("participants_count", sa.BigInteger(), nullable=True),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("region", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("description", sa.String(length=512), nullable=True),
        sa.Column("upd_date", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("group_id"),
    )

    # 4. supergroup
    op.create_table(
        "supergroup",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("supergroup_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("username", sa.String(length=32), nullable=True),
        sa.Column("participants_count", sa.BigInteger(), nullable=True),
        sa.Column("scam", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("region", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("description", sa.String(length=512), nullable=True),
        sa.Column("upd_date", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("supergroup_id"),
    )

    # 5. channel
    op.create_table(
        "channel",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("channel_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("scam", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("username", sa.String(length=32), nullable=True),
        sa.Column("participants_count", sa.BigInteger(), nullable=True),
        sa.Column("region", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("description", sa.String(length=512), nullable=True),
        sa.Column("upd_date", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("channel_id"),
    )

    # 6. dl_import_batch
    op.create_table(
        "dl_import_batch",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("files_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("files_success", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("files_failed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # 7. dl_import_file
    op.create_table(
        "dl_import_file",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("batch_id", sa.BigInteger(), nullable=False),
        sa.Column("original_file_name", sa.String(length=255), nullable=False),
        sa.Column("file_hash", sa.String(length=128), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("rows_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rows_success", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rows_failed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("replaced_file_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["batch_id"], ["dl_import_batch.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["replaced_file_id"], ["dl_import_file.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    # 8. dl_contact
    op.create_table(
        "dl_contact",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("import_file_id", sa.BigInteger(), nullable=False),
        sa.Column("telegram_id", sa.Text(), nullable=True),
        sa.Column("username", sa.Text(), nullable=True),
        sa.Column("phone", sa.Text(), nullable=True),
        sa.Column("first_name", sa.Text(), nullable=True),
        sa.Column("last_name", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("region", sa.Text(), nullable=True),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("channels_raw", sa.Text(), nullable=True),
        sa.Column("full_name", sa.Text(), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("vk_url", sa.Text(), nullable=True),
        sa.Column("email", sa.Text(), nullable=True),
        sa.Column("telegram_contact", sa.Text(), nullable=True),
        sa.Column("instagram", sa.Text(), nullable=True),
        sa.Column("viber", sa.Text(), nullable=True),
        sa.Column("odnoklassniki", sa.Text(), nullable=True),
        sa.Column("birth_date_text", sa.Text(), nullable=True),
        sa.Column("username_extra", sa.Text(), nullable=True),
        sa.Column("geo", sa.Text(), nullable=True),
        sa.Column("source_row_index", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["import_file_id"], ["dl_import_file.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # 9. dl_match_run
    op.create_table(
        "dl_match_run",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("contacts_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("matches_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("strict_matches_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("username_matches_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("phone_matches_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # 10. dl_match_result
    op.create_table(
        "dl_match_result",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("run_id", sa.BigInteger(), nullable=False),
        sa.Column("dl_contact_id", sa.BigInteger(), nullable=False),
        sa.Column("tgmbase_user_id", sa.BigInteger(), nullable=True),
        sa.Column("strict_telegram_id_match", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("username_match", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("phone_match", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("chat_activity_match", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("dl_contact_snapshot", sa.JSON(), nullable=False),
        sa.Column("tgmbase_user_snapshot", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["dl_contact_id"], ["dl_contact.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["run_id"], ["dl_match_run.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # 11. dl_match_result_chat
    op.create_table(
        "dl_match_result_chat",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("result_id", sa.BigInteger(), nullable=False),
        sa.Column("peer_id", sa.Text(), nullable=False),
        sa.Column("chat_type", sa.String(length=32), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("is_excluded", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["result_id"], ["dl_match_result.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # 12. dl_match_result_message
    op.create_table(
        "dl_match_result_message",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("result_id", sa.BigInteger(), nullable=False),
        sa.Column("peer_id", sa.Text(), nullable=False),
        sa.Column("message_id", sa.Text(), nullable=False),
        sa.Column("message_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["result_id"], ["dl_match_result.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("dl_match_result_message")
    op.drop_table("dl_match_result_chat")
    op.drop_table("dl_match_result")
    op.drop_table("dl_match_run")
    op.drop_table("dl_contact")
    op.drop_table("dl_import_file")
    op.drop_table("dl_import_batch")
    op.drop_table("channel")
    op.drop_table("supergroup")
    op.drop_table("group")
    op.drop_table("message")
    op.drop_table("user")
