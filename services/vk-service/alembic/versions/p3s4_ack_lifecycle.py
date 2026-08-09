"""Add durable staged ingestion ACK lifecycle state.

Revision ID: p3s4_ack_lifecycle
Revises: p3s3_publisher_claims
"""

from collections.abc import Sequence

from migration_helpers.p3s4_ack_lifecycle import (
    downgrade_ack_lifecycle,
    upgrade_ack_lifecycle,
)

revision: str = "p3s4_ack_lifecycle"
down_revision: str | None = "p3s3_publisher_claims"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    upgrade_ack_lifecycle()


def downgrade() -> None:
    downgrade_ack_lifecycle()
