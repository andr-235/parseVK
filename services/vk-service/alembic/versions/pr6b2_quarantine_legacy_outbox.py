"""Quarantine pending lifecycle events from the aggregate VK runtime.

Revision ID: pr6b2_quarantine_legacy_outbox
Revises: pr6b_source_collection_identity
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.sql.elements import TextClause

revision: str = "pr6b2_quarantine_legacy_outbox"
down_revision: str | None = "pr6b_source_collection_identity"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_QUARANTINE_ERROR = (
    "legacy aggregate lifecycle event quarantined by canonical source cutover"
)
_EVENT_TYPES = (
    "task.execution_started",
    "task.execution_progressed",
    "task.execution_completed",
    "task.execution_failed",
)


def quarantine_statement() -> TextClause:
    return sa.text(
        """
        UPDATE outbox_events
        SET status = 'failed',
            last_error = :error,
            locked_at = NULL
        WHERE status = 'pending'
          AND event_type IN :event_types
        """
    ).bindparams(
        sa.bindparam("event_types", expanding=True),
        error=_QUARANTINE_ERROR,
        event_types=_EVENT_TYPES,
    )


def upgrade() -> None:
    op.execute(quarantine_statement())


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE outbox_events
            SET status = 'pending',
                last_error = NULL,
                locked_at = NULL,
                next_attempt_at = now()
            WHERE status = 'failed'
              AND published_at IS NULL
              AND last_error = :error
              AND event_type IN :event_types
            """
        ).bindparams(
            sa.bindparam("event_types", expanding=True),
            error=_QUARANTINE_ERROR,
            event_types=_EVENT_TYPES,
        )
    )
