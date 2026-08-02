"""Add VK provider accounts and attempt credential metadata.

Revision ID: pr4_vk_provider_accounts
Revises: pr2c1_add_execution_sequence
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "pr4_vk_provider_accounts"
down_revision: str | None = "pr2c1_add_execution_sequence"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "vk_provider_accounts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("account_key", sa.String(128), nullable=False),
        sa.Column("provider", sa.String(32), nullable=False, server_default="vk"),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("credential_version", sa.String(64), nullable=False),
        sa.Column("capabilities", JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("cooldown_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error_code", sa.Integer(), nullable=True),
        sa.Column("last_error_kind", sa.String(64), nullable=True),
        sa.Column("last_validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revision", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("account_key", name="uq_vk_provider_accounts_account_key"),
    )
    op.add_column(
        "vk_task_runs",
        sa.Column("provider_account_key", sa.String(128), nullable=True),
    )
    op.add_column(
        "vk_task_runs",
        sa.Column("credential_version", sa.String(64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("vk_task_runs", "credential_version")
    op.drop_column("vk_task_runs", "provider_account_key")
    op.drop_table("vk_provider_accounts")
