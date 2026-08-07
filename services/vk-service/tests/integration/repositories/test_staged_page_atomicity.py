from types import SimpleNamespace

import pytest
from _ingestion_part_atomicity import manifest_counts, prepared_stager, seed_claim

from app.infrastructure.db.repositories.checkpoint import (
    SqlAlchemyIngestionCheckpointStore,
)
from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository
from app.infrastructure.db.session import SessionLocal
from app.services.ingestion.comment_collector import CommentCollector

pytestmark = pytest.mark.anyio


def adapter_for_one_page(owner_id: int, post_id: int, comment_id: int):
    async def iter_comment_pages(*args, **kwargs):
        yield {
            "items": [
                {
                    "id": comment_id,
                    "owner_id": owner_id,
                    "post_id": post_id,
                    "from_id": 5,
                    "text": "comment",
                    "date": 1_700_000_001,
                }
            ],
            "profiles": [{"id": 5, "first_name": "Alice"}],
            "groups": [],
            "count": 1,
        }
        yield {"items": [], "profiles": [], "groups": []}

    return SimpleNamespace(iter_comment_pages=iter_comment_pages)


async def persisted_state(claim, owner_id, post_id, run_id):
    staged, parts, references = await manifest_counts(
        claim.execution_id, "comment_page"
    )
    async with SessionLocal() as session:
        comments = await SqlAlchemyIngestionRepository(
            session
        ).count_comments_for_post(owner_id, post_id)
        checkpoint = await SqlAlchemyIngestionCheckpointStore(session).load(
            run_id, owner_id, post_id
        )
    return staged, parts, references, comments, checkpoint


async def run_page(marker: int, *, reject: bool):
    owner_id, post_id = -40 - marker, 90 + marker
    run_id = f"staged-page-run-{marker}"
    claim = await seed_claim(marker, "staged-page")
    async with SessionLocal() as session:
        async def commit_page():
            if reject:
                await session.rollback()
                raise RuntimeError("fence lost")
            await session.commit()

        collector = CommentCollector(
            adapter=adapter_for_one_page(owner_id, post_id, marker),
            repository=SqlAlchemyIngestionRepository(session),
            staging=prepared_stager(session, claim),
            require_staging=True,
            page_committer=commit_page,
        )
        call = collector.collect_for_post(
            owner_id=owner_id,
            post_id=post_id,
            post={"owner_id": owner_id, "id": post_id},
            author_profiles={},
            task_run=SimpleNamespace(task_id=10, run_id=run_id),
            checkpoint_store=SqlAlchemyIngestionCheckpointStore(session),
        )
        if reject:
            with pytest.raises(RuntimeError, match="fence lost"):
                await call
        else:
            await call
    return await persisted_state(claim, owner_id, post_id, run_id)


async def test_stage_parts_references_comment_and_checkpoint_commit_atomically():
    staged, parts, references, comments, checkpoint = await run_page(4, reject=False)

    assert (staged, parts, references, comments) == (1, 1, 1, 1)
    assert checkpoint is not None


async def test_fence_rejection_rolls_back_complete_page_preparation():
    staged, parts, references, comments, checkpoint = await run_page(5, reject=True)

    assert (staged, parts, references, comments) == (0, 0, 0, 0)
    assert checkpoint is None
