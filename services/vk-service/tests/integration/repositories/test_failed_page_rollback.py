from types import SimpleNamespace

import pytest
from _ingestion_part_atomicity import manifest_counts, prepared_stager, seed_claim

from app.infrastructure.db.repositories.checkpoint import (
    SqlAlchemyIngestionCheckpointStore,
)
from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository
from app.infrastructure.db.session import SessionLocal
from app.services.ingestion.checkpoint_flow import CheckpointFlow
from app.services.ingestion.comment_collector import CommentCollector
from app.services.ingestion.post_pipeline import PostCollectionPipeline
from app.services.ingestion.result import IngestionResult

pytestmark = pytest.mark.anyio


class SavedPost:
    async def save_post(self, post, *_args, **_kwargs):
        return False, dict(post)


class NoProgress:
    async def report(self, *_args, **_kwargs):
        raise AssertionError("failed pages must not report progress")


def malformed_page_adapter(owner_id: int, post_id: int):
    async def iter_comment_pages(*_args, **_kwargs):
        yield {
            "items": [
                {
                    "id": 1,
                    "owner_id": owner_id,
                    "post_id": post_id,
                    "from_id": 5,
                    "text": "valid first comment",
                    "date": 1_700_000_001,
                },
                {
                    "id": 2,
                    "owner_id": owner_id,
                    "post_id": post_id,
                    "from_id": 5,
                    "text": "invalid second comment",
                    "date": "not-a-timestamp",
                },
            ],
            "profiles": [{"id": 5, "first_name": "Alice"}],
            "groups": [],
            "count": 2,
        }

    return SimpleNamespace(iter_comment_pages=iter_comment_pages)


async def test_failed_page_rolls_back_partial_data_before_checkpoint() -> None:
    owner_id, post_id = -46, 96
    run_id = "failed-page-run"
    claim = await seed_claim(6, "failed-page")

    async with SessionLocal() as session:
        async def commit_page() -> None:
            await session.commit()

        async def rollback_page() -> None:
            await session.rollback()

        checkpoint_store = SqlAlchemyIngestionCheckpointStore(session)
        pipeline = PostCollectionPipeline(
            post_collector=SavedPost(),
            comment_collector=CommentCollector(
                adapter=malformed_page_adapter(owner_id, post_id),
                repository=SqlAlchemyIngestionRepository(session),
                staging=prepared_stager(session, claim),
                require_staging=True,
                page_committer=commit_page,
            ),
            checkpoints=CheckpointFlow(
                store=checkpoint_store,
                commit_page=commit_page,
                rollback_page=rollback_page,
                on_error=str,
            ),
            progress=NoProgress(),
        )
        result = IngestionResult(errors=[])
        await pipeline.collect(
            post={"owner_id": owner_id, "id": post_id, "from_id": owner_id},
            task_run=SimpleNamespace(task_id=10, run_id=run_id),
            group_id=46,
            profiles={},
            result=result,
            remaining_posts=0,
            correlation_id=run_id,
        )

    staged, parts, references = await manifest_counts(
        claim.execution_id,
        "comment_page",
    )
    async with SessionLocal() as session:
        repository = SqlAlchemyIngestionRepository(session)
        comments = await repository.count_comments_for_post(owner_id, post_id)
        checkpoint = await SqlAlchemyIngestionCheckpointStore(session).load(
            run_id,
            owner_id,
            post_id,
        )

    assert (staged, parts, references, comments) == (0, 0, 0, 0)
    assert checkpoint is not None
    assert checkpoint.status == "failed"
    assert checkpoint.next_offset == 0
    assert checkpoint.processed_comments == 0
    assert checkpoint.last_error is not None
    assert "not-a-timestamp" in checkpoint.last_error
    assert result.errors[-1]["post_id"] == post_id
