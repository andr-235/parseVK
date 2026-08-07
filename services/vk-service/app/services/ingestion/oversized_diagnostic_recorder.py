from dataclasses import dataclass
from datetime import UTC, datetime

from app.domain.entities.ingestion_part_diagnostics import (
    OversizedIngestionDiagnostic,
)
from app.infrastructure.db.repositories.ingestion_part_diagnostics import (
    SqlAlchemyOversizedDiagnosticRepository,
)
from app.services.ingestion.part_errors import OversizedIngestionItemError


@dataclass(frozen=True, slots=True)
class OversizedDiagnosticRecorder:
    session_factory: object

    async def record(self, error: OversizedIngestionItemError) -> None:
        diagnostic = OversizedIngestionDiagnostic.create(
            batch_id=error.batch_id,
            item_kind=error.item_kind,
            item_identity=error.item_identity,
            versions=error.versions,
            wire_bytes_count=error.wire_bytes_count,
            hard_limit_bytes=error.hard_limit_bytes,
            reason=str(error),
            created_at=datetime.now(UTC),
        )
        async with self.session_factory() as session:
            repository = SqlAlchemyOversizedDiagnosticRepository(session)
            await repository.record(diagnostic)
            await session.commit()
