from dataclasses import dataclass

from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.domain.entities.ingestion_parts import IngestionPart
from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.domain.repositories.ingestion_parts import IngestionPartRepository
from app.services.ingestion.part_preparer import prepare_staged_batch


@dataclass(frozen=True, slots=True)
class IngestionPartPreparationService:
    repository: IngestionPartRepository
    versions: IngestionPartVersions = IngestionPartVersions()

    async def prepare(
        self,
        batch: StagedIngestionBatch,
    ) -> tuple[tuple[IngestionPart, ...], bool]:
        prepared = prepare_staged_batch(
            batch,
            versions=self.versions,
            prepared_at=batch.staged_at,
        )
        return await self.repository.prepare(
            prepared.parts,
            prepared.references,
        )
