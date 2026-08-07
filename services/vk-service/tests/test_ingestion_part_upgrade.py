from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.domain.entities.ingestion_part_identity import IngestionPartVersions
from app.domain.entities.ingestion_staging import StagedIngestionBatch
from app.domain.repositories.ingestion_parts import IngestionPartConflictError
from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.repositories.ingestion_parts import (
    SqlAlchemyIngestionPartRepository,
)
from app.infrastructure.db.repositories.ingestion_staging import (
    SqlAlchemyIngestionStagingRepository,
)
from app.infrastructure.db.session import SessionLocal
from app.services.ingestion.part_preparer import prepare_staged_batch
from app.services.ingestion.staging_envelopes import post_snapshot_payload
from app.services.ingestion.staging_writer import POST_SNAPSHOT, STAGING_SCHEMA_VERSION

pytestmark = pytest.mark.anyio

_EXECUTION_ID = UUID("81111111-1111-1111-1111-111111111111")
_ATTEMPT_ID = UUID("82222222-2222-2222-2222-222222222222")
_STAGED_AT = datetime(2026, 8, 7, 1, 2, 3, tzinfo=UTC)


async def test_restart_reproduces_prior_version_exact_bytes_and_blocks_repacking():
    versions = IngestionPartVersions()
    post = {"owner_id": -42, "id": 99, "from_id": -42, "text": "Привет 👋"}
    batch = StagedIngestionBatch.create(
        execution_id=_EXECUTION_ID,
        attempt_id=_ATTEMPT_ID,
        fencing_token=7,
        source_kind=POST_SNAPSHOT,
        owner_id=-42,
        post_id=99,
        page_offset=0,
        payload=post_snapshot_payload(
            schema_version=STAGING_SCHEMA_VERSION,
            source_kind=POST_SNAPSHOT,
            owner_id=-42,
            post_id=99,
            post=post,
            authors=[
                {
                    "vk_author_id": -42,
                    "type": "group",
                    "display_name": "Группа",
                }
            ],
        ),
        staged_at=_STAGED_AT,
    )

    async with SessionLocal() as session, session.begin():
        session.add(
            VkExecution(
                id=_EXECUTION_ID,
                task_id=10,
                owner_user_id="user-1",
                run_id="upgrade-run",
                status="running",
                plan_snapshot={"source": {"externalId": "42"}},
            )
        )
        stored_batch, _ = await SqlAlchemyIngestionStagingRepository(session).stage(
            batch
        )
        prepared = prepare_staged_batch(
            stored_batch,
            versions=versions,
            prepared_at=stored_batch.staged_at,
        )
        await SqlAlchemyIngestionPartRepository(session).prepare(
            prepared.parts,
            prepared.references,
        )

    async with SessionLocal() as session:
        staging_repository = SqlAlchemyIngestionStagingRepository(session)
        part_repository = SqlAlchemyIngestionPartRepository(session)
        reloaded_batch = await staging_repository.get(batch.batch_id)
        reloaded_parts = await part_repository.list_for_batch(batch.batch_id)

        assert reloaded_batch is not None
        rebuilt = prepare_staged_batch(
            reloaded_batch,
            versions=versions,
            prepared_at=reloaded_batch.staged_at,
        )
        assert reloaded_parts == rebuilt.parts == prepared.parts
        assert reloaded_parts[0].wire_bytes == prepared.parts[0].wire_bytes
        assert reloaded_parts[0].wire_digest == prepared.parts[0].wire_digest

        repacked = prepare_staged_batch(
            reloaded_batch,
            versions=IngestionPartVersions(packing=2),
            prepared_at=reloaded_batch.staged_at,
        )
        with pytest.raises(IngestionPartConflictError):
            await part_repository.prepare(repacked.parts, repacked.references)
