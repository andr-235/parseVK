from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.domain.repositories.ingestion_staging import (
    IngestionStagingRepository,
    StagingPayloadConflictError,
    StagingPayloadIntegrityError,
)
from app.infrastructure.metrics.ingestion_staging_metrics import (
    observe_staging_result,
)
from app.services.ingestion.staging_envelopes import (
    comment_page_payload,
    post_snapshot_payload,
)
from app.services.ingestion.staging_payload import assert_physical_payload

STAGING_SCHEMA_VERSION = 1
POST_SNAPSHOT = "post_snapshot"
COMMENT_PAGE = "comment_page"


@dataclass(frozen=True, slots=True)
class PhysicalIngestionStager:
    repository: IngestionStagingRepository
    execution_id: UUID
    attempt_id: UUID
    fencing_token: int

    @classmethod
    def from_claim(
        cls,
        repository: IngestionStagingRepository,
        claim: Any,
    ) -> PhysicalIngestionStager:
        return cls(
            repository=repository,
            execution_id=claim.execution_id,
            attempt_id=claim.attempt_id,
            fencing_token=claim.fencing_token,
        )

    async def stage_post(
        self,
        *,
        post: dict[str, Any],
        authors: list[dict[str, Any]],
    ) -> tuple[StagedIngestionBatch, bool]:
        source_kind = POST_SNAPSHOT
        try:
            owner_id = int(post["owner_id"])
            post_id = int(post["id"])
            payload = post_snapshot_payload(
                schema_version=STAGING_SCHEMA_VERSION,
                source_kind=source_kind,
                owner_id=owner_id,
                post_id=post_id,
                post=post,
                authors=authors,
            )
        except (KeyError, TypeError, ValueError) as error:
            self._raise_integrity(source_kind, error)
        return await self._stage(
            source_kind=source_kind,
            owner_id=owner_id,
            post_id=post_id,
            page_offset=0,
            payload=payload,
        )

    async def stage_comment_page(
        self,
        *,
        post: dict[str, Any],
        page: dict[str, Any],
        page_offset: int,
        next_offset: int,
    ) -> tuple[StagedIngestionBatch, bool]:
        source_kind = COMMENT_PAGE
        try:
            owner_id = int(post["owner_id"])
            post_id = int(post["id"])
            payload = comment_page_payload(
                schema_version=STAGING_SCHEMA_VERSION,
                source_kind=source_kind,
                owner_id=owner_id,
                post_id=post_id,
                post=post,
                page=page,
                page_offset=page_offset,
                next_offset=next_offset,
            )
        except (KeyError, TypeError, ValueError) as error:
            self._raise_integrity(source_kind, error)
        return await self._stage(
            source_kind=source_kind,
            owner_id=owner_id,
            post_id=post_id,
            page_offset=page_offset,
            payload=payload,
        )

    async def _stage(
        self,
        *,
        source_kind: str,
        owner_id: int,
        post_id: int,
        page_offset: int,
        payload: dict[str, Any],
    ) -> tuple[StagedIngestionBatch, bool]:
        try:
            assert_physical_payload(payload)
            batch = StagedIngestionBatch.create(
                execution_id=self.execution_id,
                attempt_id=self.attempt_id,
                fencing_token=self.fencing_token,
                source_kind=source_kind,
                owner_id=owner_id,
                post_id=post_id,
                page_offset=page_offset,
                payload=payload,
            )
            stored, created = await self.repository.stage(batch)
        except StagingPayloadConflictError:
            observe_staging_result(source_kind, "conflict")
            raise
        except StagingPayloadIntegrityError:
            observe_staging_result(source_kind, "integrity_error")
            raise
        except ValueError as error:
            self._raise_integrity(source_kind, error)
        observe_staging_result(source_kind, "created" if created else "reused")
        return stored, created

    @staticmethod
    def _raise_integrity(source_kind: str, error: Exception) -> None:
        observe_staging_result(source_kind, "integrity_error")
        raise StagingPayloadIntegrityError(
            f"invalid {source_kind} staging payload"
        ) from error
