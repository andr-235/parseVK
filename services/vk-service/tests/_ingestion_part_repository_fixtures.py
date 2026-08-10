from datetime import UTC, datetime
from uuid import UUID

from app.domain.entities.ingestion_part_identity import (
    COMMENT_PART,
    IngestionPartVersions,
)
from app.domain.entities.ingestion_parts import (
    IngestionPart,
    IngestionPartReference,
)
from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.repositories.ingestion_staging import (
    SqlAlchemyIngestionStagingRepository,
)

EXECUTION_ID = UUID("11111111-1111-1111-1111-111111111111")
ATTEMPT_ID = UUID("22222222-2222-2222-2222-222222222222")
PREPARED_AT = datetime(2026, 8, 7, tzinfo=UTC)


async def create_batch(session):
    session.add(
        VkExecution(
            id=EXECUTION_ID,
            task_id=10,
            owner_user_id="user-1",
            run_id="run-1",
            status="running",
            plan_snapshot={"source": {"externalId": "42"}},
        )
    )
    await session.flush()
    batch = StagedIngestionBatch.create(
        execution_id=EXECUTION_ID,
        attempt_id=ATTEMPT_ID,
        fencing_token=7,
        source_kind="comment_page",
        owner_id=-42,
        post_id=99,
        page_offset=0,
        payload={
            "schemaVersion": 1,
            "source": {
                "kind": "comment_page",
                "ownerId": -42,
                "postId": 99,
                "pageOffset": 0,
                "nextOffset": 2,
            },
            "observed": {"post": {"owner_id": -42, "id": 99}},
            "providerMetadata": {},
        },
    )
    stored, _ = await SqlAlchemyIngestionStagingRepository(session).stage(batch)
    return stored


def make_parts(batch_id, *, versions=IngestionPartVersions(), suffix=""):
    parts = tuple(
        IngestionPart.create(
            batch_id=batch_id,
            part_kind=COMMENT_PART,
            part_index=index,
            part_count=2,
            versions=versions,
            item_manifest=(f"comment:{index}",),
            author_manifest=(index + 1,),
            prepared_at=PREPARED_AT,
            wire_bytes=f'{{"part":{index},"suffix":"{suffix}"}}'.encode(),
        )
        for index in range(2)
    )
    references = tuple(
        IngestionPartReference(part_id=part.message_id) for part in parts
    )
    return parts, references
