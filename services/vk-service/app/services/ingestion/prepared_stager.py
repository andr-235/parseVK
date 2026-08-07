from dataclasses import dataclass
from typing import Any

from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.services.ingestion.part_preparation_service import (
    IngestionPartPreparationService,
)
from app.services.ingestion.staging_writer import PhysicalIngestionStager


@dataclass(frozen=True, slots=True)
class PreparedPhysicalIngestionStager:
    staging: PhysicalIngestionStager
    parts: IngestionPartPreparationService

    @property
    def repository(self):
        return self.staging.repository

    @property
    def execution_id(self):
        return self.staging.execution_id

    async def stage_post(
        self,
        *,
        post: dict[str, Any],
        authors: list[dict[str, Any]],
    ) -> tuple[StagedIngestionBatch, bool]:
        batch, created = await self.staging.stage_post(
            post=post,
            authors=authors,
        )
        await self.parts.prepare(batch)
        return batch, created

    async def stage_comment_page(
        self,
        *,
        post: dict[str, Any],
        page: dict[str, Any],
        page_offset: int,
        next_offset: int,
    ) -> tuple[StagedIngestionBatch, bool]:
        batch, created = await self.staging.stage_comment_page(
            post=post,
            page=page,
            page_offset=page_offset,
            next_offset=next_offset,
        )
        await self.parts.prepare(batch)
        return batch, created

    async def prepare_existing(self, batch: StagedIngestionBatch) -> None:
        await self.parts.prepare(batch)
