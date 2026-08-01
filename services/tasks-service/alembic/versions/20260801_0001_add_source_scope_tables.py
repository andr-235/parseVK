"""Add monitoring_sources, task_sources, access_scopes, scope_source_access

Revision ID: 20260801_0001_add_source_scope_tables
Revises: pr2c1_progress_event_fields
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "20260801_0001_add_source_scope_tables"
down_revision: str | None = "pr2c1_progress_event_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "monitoring_sources",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("owner_user_id", sa.String(length=128), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("source_type", sa.String(length=32), nullable=False),
        sa.Column("external_id", sa.String(length=64), nullable=False),
        sa.Column("owner_id", sa.BigInteger(), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("revision", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "source_type", "external_id", name="uq_monitoring_sources_identity"),
        sa.CheckConstraint("owner_id < 0", name="ck_monitoring_sources_owner_negative"),
        sa.CheckConstraint("revision >= 0", name="ck_monitoring_sources_revision"),
        sa.CheckConstraint("status IN ('active', 'inactive')", name="ck_monitoring_sources_status"),
    )
    op.create_table(
        "task_sources",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", sa.BigInteger(), nullable=False),
        sa.Column("source_id", UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False, server_default="target"),
        sa.Column("revision", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_id"], ["monitoring_sources.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_id", "source_id", name="uq_task_sources_task_source"),
        sa.CheckConstraint("kind IN ('target', 'reference')", name="ck_task_sources_kind"),
        sa.CheckConstraint("revision >= 0", name="ck_task_sources_revision"),
    )
    op.create_table(
        "access_scopes",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("owner_user_id", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_by_user_id", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "scope_source_access",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("access_scope_id", UUID(as_uuid=True), nullable=False),
        sa.Column("source_id", UUID(as_uuid=True), nullable=False),
        sa.Column("ref_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_by", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["access_scope_id"], ["access_scopes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_id"], ["monitoring_sources.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("access_scope_id", "source_id", name="uq_scope_source_access_scope_source"),
        sa.CheckConstraint("ref_count >= 0", name="ck_scope_source_access_ref_count"),
    )
    op.create_index("ix_scope_source_access_source", "scope_source_access", ["source_id"])
    op.create_index("ix_scope_source_access_scope", "scope_source_access", ["access_scope_id"])


def downgrade() -> None:
    op.drop_index("ix_scope_source_access_scope", table_name="scope_source_access")
    op.drop_index("ix_scope_source_access_source", table_name="scope_source_access")
    op.drop_table("scope_source_access")
    op.drop_table("access_scopes")
    op.drop_table("task_sources")
    op.drop_table("monitoring_sources")
