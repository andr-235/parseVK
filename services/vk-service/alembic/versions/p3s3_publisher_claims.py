"""Add lease-safe staged part publication claims.

Revision ID: p3s3_publisher_claims
Revises: p3s2_ingestion_parts
"""

from collections.abc import Sequence

from migration_helpers.p3s3_publisher_claims import (
    add_publication_claims,
    drop_publication_claims,
)

revision: str = "p3s3_publisher_claims"
down_revision: str | None = "p3s2_ingestion_parts"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    add_publication_claims()


def downgrade() -> None:
    drop_publication_claims()
