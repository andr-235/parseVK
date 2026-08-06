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
from app.services.ingestion.staging_payload import (
    assert_physical_payload,
    stable_entities,
)

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
        owner_id = int(post["owner_id"])
        post_id = int(post["id"])
        return await self._stage(
            source_kind=POST_SNAPSHOT,
            owner_id=owner_id,
            post_id=post_id,
            page_offset=0,
            payload={
                "schemaVersion": STAGING_SCHEMA_VERSION,
                "source": {
                    "kind": POST_SNAPSHOT,
                    "ownerId": owner_id,
                    "postId": post_id,
                    "pageOffset": 0,
                    "nextOffset": None,
                },
                "observed": {
                    "post": dict(post),
                    "authors": stable_entities(authors),
                },
                "providerMetadata": {},
            },
        )

    async def stage_comment_page(
        self,
        *,
        post: dict[str, Any],
        page: dict[str, Any],
        page_offset: int,
        next_offset: int,
    ) -> tuple[StagedIngestionBatch, bool]:
        owner_id = int(post["owner_id"])
        post_id = int(post["id"])
        return await self._stage(
            source_kind=COMMENT_PAGE,
            owner_id=owner_id,
            post_id=post_id,
            page_offset=page_offset,
            payload={
                "schemaVersion": STAGING_SCHEMA_VERSION,
                "source": {
                    "kind": COMMENT_PAGE,
                    "ownerId": owner_id,
                    "postId": post_id,
                    "pageOffset": page_offset,
                    "nextOffset": next_offset,
                },
                "observed": {
                    "post": dict(post),
                    "comments": [dict(item) for item in page.get("items") or []],
                    "profiles": stable_entities(page.get("profiles")),
                    "groups": stable_entities(page.get("groups")),
                },
                "providerMetadata": {
                    key: value
                    for key, value in page.items()
                    if key not in {"items", "profiles", "groups"}
                },
            },
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
        except (StagingPayloadIntegrityError, ValueError):
            observe_staging_result(source_kind, "integrity_error")
            raise
        observe_staging_result(source_kind, "created" if created else "reused")
        return stored, created
