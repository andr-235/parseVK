"""add temporary password state to users"""

import sqlalchemy as sa
from alembic import op

revision = "20260623_0003"
down_revision = "20260623_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_temporary_password",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.create_check_constraint(
        "ck_users_role_allowed",
        "users",
        "role IN ('admin', 'user')",
    )
    op.create_index(
        "ix_users_admin_filters",
        "users",
        ["role", "is_active", "is_temporary_password"],
    )
    op.create_index(
        "ix_users_admin_created",
        "users",
        ["created_at", "id"],
    )


def downgrade() -> None:
    op.drop_index("ix_users_admin_created", table_name="users")
    op.drop_index("ix_users_admin_filters", table_name="users")
    op.drop_constraint("ck_users_role_allowed", "users", type_="check")
    op.drop_column("users", "is_temporary_password")
