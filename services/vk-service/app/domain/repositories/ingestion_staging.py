from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.domain.entities.ingestion_staging import StagedIngestionBatch


class StagingPayloadConflictError(RuntimeError):
    """The same physical source position was staged with incompatible data."""


class StagingPayloadIntegrityError(RuntimeError):
    """A staged batch no longer matches its deterministic identity or digest."""


class IngestionStagingRepository(Protocol):
    async def stage(
        self, batch: StagedIngestionBatch
    ) -> tuple[StagedIngestionBatch, bool]: ...

    async def get(self, batch_id: UUID) -> StagedIngestionBatch | None: ...
