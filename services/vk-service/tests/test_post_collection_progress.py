from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.services.ingestion.post_pipeline import PostCollectionPipeline
from app.services.ingestion.result import IngestionResult


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("remaining_posts", "expected_total"),
    [(2, 7), (0, 5)],
)
async def test_progress_includes_known_remaining_posts(
    remaining_posts: int,
    expected_total: int,
):
    post_collector = SimpleNamespace(save_post=AsyncMock(return_value=False))
    comment_collector = SimpleNamespace(collect_for_post=AsyncMock(return_value=3))
    checkpoints = SimpleNamespace(
        store=object(),
        commit=AsyncMock(),
        resume=AsyncMock(return_value=(0, None, False)),
        complete=AsyncMock(),
        fail=AsyncMock(),
    )
    progress = SimpleNamespace(report=AsyncMock())
    pipeline = PostCollectionPipeline(
        post_collector=post_collector,
        comment_collector=comment_collector,
        checkpoints=checkpoints,
        progress=progress,
    )
    task_run = SimpleNamespace()
    result = IngestionResult(groups=1)

    await pipeline.collect(
        post={"owner_id": -10, "id": 20},
        task_run=task_run,
        group_id=10,
        profiles={},
        result=result,
        remaining_posts=remaining_posts,
        correlation_id="correlation-1",
    )

    progress.report.assert_awaited_once_with(
        task_run,
        processed=5,
        total=expected_total,
    )
