"""Add deterministic ingestion parts and oversized diagnostics.

Revision ID: p3s2_ingestion_parts
Revises: p3s1_ingestion_staging
"""

from collections.abc import Sequence

from migration_helpers.p3s2_diagnostics import (
    create_diagnostic_table,
    drop_diagnostic_table,
)
from migration_helpers.p3s2_parts import create_part_tables, drop_part_tables

revision: str = "p3s2_ingestion_parts"
down_revision: str | None = "p3s1_ingestion_staging"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    create_part_tables()
    create_diagnostic_table()


def downgrade() -> None:
    drop_diagnostic_table()
    drop_part_tables()
