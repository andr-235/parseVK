"""create content listings"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260524_0002"
down_revision = "20260508_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "content_listings",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("source", sa.Text(), nullable=True),
        sa.Column("external_id", sa.Text(), nullable=True),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=True),
        sa.Column("currency", sa.Text(), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("city", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("rooms", sa.Integer(), nullable=True),
        sa.Column("area_total", sa.Float(), nullable=True),
        sa.Column("area_living", sa.Float(), nullable=True),
        sa.Column("area_kitchen", sa.Float(), nullable=True),
        sa.Column("floor", sa.Integer(), nullable=True),
        sa.Column("floors_total", sa.Integer(), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("contact_name", sa.Text(), nullable=True),
        sa.Column("contact_phone", sa.Text(), nullable=True),
        sa.Column("images", postgresql.ARRAY(sa.Text()), nullable=False, server_default="{}"),
        sa.Column("source_author_name", sa.Text(), nullable=True),
        sa.Column("source_author_phone", sa.Text(), nullable=True),
        sa.Column("source_author_url", sa.Text(), nullable=True),
        sa.Column("source_posted_at", sa.Text(), nullable=True),
        sa.Column("source_parsed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("manual_overrides", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("manual_note", sa.Text(), nullable=True),
        sa.Column("archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url"),
    )
    op.create_index("ix_content_listings_city", "content_listings", ["city"])
    op.create_index("ix_content_listings_price", "content_listings", ["price"])
    op.create_index("ix_content_listings_archived", "content_listings", ["archived"])
    op.create_index("ix_content_listings_contact_phone", "content_listings", ["contact_phone"])


def downgrade() -> None:
    op.drop_index("ix_content_listings_contact_phone", table_name="content_listings")
    op.drop_index("ix_content_listings_archived", table_name="content_listings")
    op.drop_index("ix_content_listings_price", table_name="content_listings")
    op.drop_index("ix_content_listings_city", table_name="content_listings")
    op.drop_table("content_listings")
