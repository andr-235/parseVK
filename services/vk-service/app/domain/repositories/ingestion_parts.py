from typing import Protocol
from uuid import UUID

from app.domain.entities.ingestion_parts import (
    IngestionPart,
    IngestionPartReference,
)


class IngestionPartConflictError(RuntimeError):
    """An existing batch was prepared with another immutable manifest."""


class IngestionPartIntegrityError(RuntimeError):
    """A persisted part no longer matches its identity, manifest or wire bytes."""


class IngestionPartRepository(Protocol):
    async def prepare(
        self,
        parts: tuple[IngestionPart, ...],
        references: tuple[IngestionPartReference, ...],
    ) -> tuple[tuple[IngestionPart, ...], bool]: ...

    async def list_for_batch(self, batch_id: UUID) -> tuple[IngestionPart, ...]: ...
