"""Add durable per-user source registrations.

Revision ID: p2h7_source_registrations
Revises: p2h3_task_run_immutable
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "p2h7_source_registrations"
down_revision: str | None = "p2h3_task_run_immutable"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "source_registrations",
        sa.Column("owner_user_id", sa.String(length=128), nullable=False),
        sa.Column(
            "source_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["source_id"],
            ["monitoring_sources.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "owner_user_id",
            "source_id",
            name="pk_source_registrations",
        ),
    )
    op.create_index(
        "ix_source_registrations_source",
        "source_registrations",
        ["source_id"],
        unique=False,
    )
    op.execute(
        """
        INSERT INTO source_registrations (owner_user_id, source_id, created_at)
        SELECT owner_user_id, id, created_at
        FROM monitoring_sources
        ON CONFLICT (owner_user_id, source_id) DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_index(
        "ix_source_registrations_source",
        table_name="source_registrations",
    )
    op.drop_table("source_registrations")
