from typing import Protocol
from uuid import UUID

from app.domain.entities.ingestion_part_diagnostics import (
    OversizedIngestionDiagnostic,
)


class OversizedDiagnosticConflictError(RuntimeError):
    """An oversized identity already has incompatible quarantine evidence."""


class OversizedDiagnosticRepository(Protocol):
    async def record(
        self,
        diagnostic: OversizedIngestionDiagnostic,
    ) -> tuple[OversizedIngestionDiagnostic, bool]: ...

    async def get(
        self,
        diagnostic_id: UUID,
    ) -> OversizedIngestionDiagnostic | None: ...
