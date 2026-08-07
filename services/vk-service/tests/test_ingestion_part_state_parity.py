import re

from app.domain.entities.ingestion_part_identity import APPLICATION_HARD_LIMIT_BYTES
from app.domain.entities.ingestion_parts import PART_STATUSES, REFERENCE_STATUSES
from app.infrastructure.db.models.ingestion_part_diagnostics import (
    VkIngestionOversizedDiagnostic,
)
from app.infrastructure.db.models.ingestion_parts import (
    VkIngestionPartReference,
    VkIngestionStagingPart,
)


def constraint_sql(model, name: str) -> str:
    constraint = next(
        item for item in model.__table__.constraints if item.name == name
    )
    return str(constraint.sqltext)


def quoted_values(sql: str) -> frozenset[str]:
    return frozenset(re.findall(r"'([^']+)'", sql))


def test_part_and_reference_states_match_sql_constraints() -> None:
    part_sql = constraint_sql(
        VkIngestionStagingPart,
        "ck_vk_ingestion_part_status",
    )
    reference_sql = constraint_sql(
        VkIngestionPartReference,
        "ck_vk_ingestion_part_reference_status",
    )

    assert quoted_values(part_sql) == PART_STATUSES
    assert quoted_values(reference_sql) == REFERENCE_STATUSES


def test_hard_limit_and_quarantine_state_match_sql_constraints() -> None:
    wire_sql = constraint_sql(
        VkIngestionStagingPart,
        "ck_vk_ingestion_part_wire_bytes",
    )
    diagnostic_sql = constraint_sql(
        VkIngestionOversizedDiagnostic,
        "ck_vk_ingestion_oversized_status",
    )

    assert str(APPLICATION_HARD_LIMIT_BYTES) in wire_sql
    assert quoted_values(diagnostic_sql) == frozenset({"quarantined"})
