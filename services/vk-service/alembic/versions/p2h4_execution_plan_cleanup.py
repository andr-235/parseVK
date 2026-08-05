"""Remove task-shaped fields from canonical physical VK executions.

Revision ID: p2h4_execution_plan_cleanup
Revises: pr6b2_quarantine_legacy_outbox
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY, UUID

revision: str = "p2h4_execution_plan_cleanup"
down_revision: str | None = "pr6b2_quarantine_legacy_outbox"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("fk_vk_executions_parent", "vk_executions", type_="foreignkey")
    op.drop_column("vk_executions", "parent_execution_id")
    op.drop_column("vk_executions", "group_ids")
    op.drop_column("vk_executions", "mode")
    op.drop_column("vk_executions", "scope")


def downgrade() -> None:
    op.add_column("vk_executions", sa.Column("scope", sa.String(32), nullable=True))
    op.add_column("vk_executions", sa.Column("mode", sa.String(64), nullable=True))
    op.add_column("vk_executions", sa.Column("group_ids", ARRAY(sa.BigInteger()), nullable=True))
    op.add_column("vk_executions", sa.Column("parent_execution_id", UUID(as_uuid=True), nullable=True))
    op.execute(
        """
        UPDATE vk_executions
        SET scope = 'selected',
            mode = 'recent_posts',
            group_ids = CASE
                WHEN plan_snapshot #>> '{source,externalId}' ~ '^[0-9]+$'
                THEN ARRAY[(plan_snapshot #>> '{source,externalId}')::bigint]
                ELSE ARRAY[]::bigint[]
            END
        """
    )
    op.alter_column("vk_executions", "scope", nullable=False)
    op.alter_column("vk_executions", "mode", nullable=False)
    op.alter_column("vk_executions", "group_ids", nullable=False)
    op.create_foreign_key(
        "fk_vk_executions_parent",
        "vk_executions",
        "vk_executions",
        ["parent_execution_id"],
        ["id"],
        ondelete="SET NULL",
    )
