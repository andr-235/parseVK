from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import UUID

from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.repositories.ingestion_parts import (
    SqlAlchemyIngestionPartRepository,
)
from app.infrastructure.db.repositories.ingestion_staging import (
    SqlAlchemyIngestionStagingRepository,
)
from app.services.ingestion.part_preparer import prepare_staged_batch

EXECUTION_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
ATTEMPT_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
PREPARED_AT = datetime(2026, 8, 7, tzinfo=UTC)


async def seed_publishable_post(
    session,
    *,
    versions: IngestionPartVersions = IngestionPartVersions(),
    execution_id: UUID = EXECUTION_ID,
    attempt_id: UUID = ATTEMPT_ID,
    fencing_token: int = 7,
    add_execution: bool = True,
):
    if add_execution:
        await _add_execution(session, execution_id)
    batch = StagedIngestionBatch.create(
        execution_id=execution_id,
        attempt_id=attempt_id,
        fencing_token=fencing_token,
        source_kind="post_snapshot",
        owner_id=-42,
        post_id=99,
        page_offset=0,
        payload={
            "schemaVersion": 1,
            "source": {
                "kind": "post_snapshot",
                "ownerId": -42,
                "postId": 99,
                "pageOffset": 0,
                "nextOffset": None,
            },
            "observed": {
                "post": {
                    "owner_id": -42,
                    "id": 99,
                    "from_id": -42,
                    "text": "Exact staged post 🚂",
                },
                "authors": [
                    {
                        "vk_author_id": -42,
                        "type": "group",
                        "display_name": "Publisher test group",
                    }
                ],
            },
            "providerMetadata": {"count": 1},
        },
        staged_at=PREPARED_AT,
    )
    stored, parts = await _prepare(session, batch, versions)
    return SimpleNamespace(batch_id=stored.batch_id, part=parts[0])


async def seed_publishable_comment_parts(session):
    await _add_execution(session, EXECUTION_ID)
    comments = [
        {"id": 10, "from_id": 1, "text": "a" * 300_000},
        {"id": 20, "from_id": 2, "text": "b" * 300_000},
    ]
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
                "nextOffset": None,
            },
            "observed": {
                "post": {"owner_id": -42, "id": 99, "from_id": -42},
                "comments": comments,
                "profiles": [
                    {"id": 1, "first_name": "One"},
                    {"id": 2, "first_name": "Two"},
                ],
                "groups": [{"id": 42, "name": "Publisher test group"}],
            },
            "providerMetadata": {"count": len(comments)},
        },
        staged_at=PREPARED_AT,
    )
    stored, parts = await _prepare(session, batch, IngestionPartVersions())
    assert len(parts) == 2
    return SimpleNamespace(batch_id=stored.batch_id, parts=parts)


async def _add_execution(session, execution_id: UUID) -> None:
    session.add(
        VkExecution(
            id=execution_id,
            task_id=100,
            owner_user_id="publisher-test-user",
            run_id="publisher-test-run",
            status="running",
            plan_snapshot={"source": {"externalId": "42"}},
        )
    )
    await session.flush()


async def _prepare(session, batch, versions: IngestionPartVersions):
    stored, _ = await SqlAlchemyIngestionStagingRepository(session).stage(batch)
    prepared = prepare_staged_batch(
        stored,
        versions=versions,
        prepared_at=stored.staged_at,
    )
    parts, _created = await SqlAlchemyIngestionPartRepository(session).prepare(
        prepared.parts,
        prepared.references,
    )
    await session.flush()
    return stored, parts
