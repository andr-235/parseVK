from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest

from app.domain.entities.ingestion_part_diagnostics import (
    OversizedIngestionDiagnostic,
)
from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.domain.repositories.ingestion_part_diagnostics import (
    OversizedDiagnosticConflictError,
)
from app.infrastructure.db.models.ingestion_part_diagnostics import (
    VkIngestionOversizedDiagnostic,
)
from app.infrastructure.db.repositories.ingestion_part_diagnostics import (
    SqlAlchemyOversizedDiagnosticRepository,
)

pytestmark = pytest.mark.anyio


def diagnostic(
    *,
    wire_bytes_count: int = 800_000,
    created_at: datetime | None = None,
) -> OversizedIngestionDiagnostic:
    return OversizedIngestionDiagnostic.create(
        batch_id=UUID("11111111-1111-1111-1111-111111111111"),
        item_kind="comment",
        item_identity="comment:99",
        versions=IngestionPartVersions(),
        wire_bytes_count=wire_bytes_count,
        hard_limit_bytes=768 * 1024,
        reason="comment 99 exceeds the application hard limit",
        created_at=created_at or datetime(2026, 8, 7, 1, 0, tzinfo=UTC),
    )


async def test_diagnostic_is_idempotent_without_staged_batch_fk(db_session) -> None:
    repository = SqlAlchemyOversizedDiagnosticRepository(db_session)
    first = diagnostic()
    replay = diagnostic(created_at=first.created_at + timedelta(minutes=5))

    stored, created = await repository.record(first)
    reused, replay_created = await repository.record(replay)

    assert created is True
    assert replay_created is False
    assert reused == stored
    assert reused.created_at == first.created_at
    assert not VkIngestionOversizedDiagnostic.__table__.c.batch_id.foreign_keys


async def test_diagnostic_rejects_incompatible_measurement(db_session) -> None:
    repository = SqlAlchemyOversizedDiagnosticRepository(db_session)
    await repository.record(diagnostic())

    with pytest.raises(
        OversizedDiagnosticConflictError,
        match="incompatible evidence",
    ):
        await repository.record(diagnostic(wire_bytes_count=810_000))
