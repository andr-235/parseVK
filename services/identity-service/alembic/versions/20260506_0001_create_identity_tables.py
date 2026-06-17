"""create identity tables

Revision ID: 20260506_0001
Revises:
Create Date: 2026-05-06
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260506_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS citext"))

    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID NOT NULL,
            username CITEXT NOT NULL,
            email CITEXT,
            password_hash TEXT NOT NULL,
            role VARCHAR(64) NOT NULL,
            is_active BOOLEAN NOT NULL,
            is_superuser BOOLEAN NOT NULL,
            password_changed_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (id),
            CONSTRAINT uq_users_username UNIQUE (username),
            CONSTRAINT uq_users_email UNIQUE (email)
        )
    """))

    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id UUID NOT NULL,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL,
            token_family_id UUID NOT NULL,
            replaced_by_token_id UUID,
            revoked_at TIMESTAMPTZ,
            expires_at TIMESTAMPTZ NOT NULL,
            last_used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL,
            user_agent_hash TEXT,
            ip_hash TEXT,
            PRIMARY KEY (id),
            CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash)
        )
    """))
    op.execute("CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_refresh_tokens_family ON refresh_tokens (token_family_id)")

    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS outbox_events (
            id UUID NOT NULL,
            event_type VARCHAR(255) NOT NULL,
            event_version INTEGER NOT NULL,
            aggregate_type VARCHAR(255) NOT NULL,
            aggregate_id TEXT NOT NULL,
            correlation_id TEXT,
            payload JSONB NOT NULL,
            status VARCHAR(32) NOT NULL,
            attempts INTEGER NOT NULL,
            next_attempt_at TIMESTAMPTZ NOT NULL,
            locked_at TIMESTAMPTZ,
            published_at TIMESTAMPTZ,
            last_error TEXT,
            created_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (id)
        )
    """))
    op.execute("CREATE INDEX IF NOT EXISTS ix_outbox_events_status_next_attempt "
               "ON outbox_events (status, next_attempt_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_outbox_events_aggregate "
               "ON outbox_events (aggregate_type, aggregate_id)")


def downgrade() -> None:
    op.drop_index("ix_outbox_events_aggregate", table_name="outbox_events")
    op.drop_index("ix_outbox_events_status_next_attempt", table_name="outbox_events")
    op.drop_table("outbox_events")
    op.drop_index("ix_refresh_tokens_family", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
