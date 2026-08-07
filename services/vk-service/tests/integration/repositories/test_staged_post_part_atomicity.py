from types import SimpleNamespace

import pytest
from _ingestion_part_atomicity import manifest_counts, prepared_stager, seed_claim
from sqlalchemy import func, select

from app.infrastructure.db.models.vk_ingestion import VkAuthor, VkPost
from app.infrastructure.db.repositories.ingestion import SqlAlchemyIngestionRepository
from app.infrastructure.db.session import SessionLocal
from app.services.ingestion.post_collector import PostCollector

pytestmark = pytest.mark.anyio


async def persisted_state(claim, owner_id, post_id):
    staged, parts, references = await manifest_counts(
        claim.execution_id, "post_snapshot"
    )
    async with SessionLocal() as session:
        posts = await session.scalar(
            select(func.count(VkPost.id)).where(
                VkPost.vk_owner_id == owner_id,
                VkPost.vk_post_id == post_id,
            )
        )
        authors = await session.scalar(
            select(func.count(VkAuthor.id)).where(VkAuthor.vk_author_id == owner_id)
        )
    return staged, parts, references, int(posts or 0), int(authors or 0)


async def run_post(marker: int, *, reject: bool):
    claim = await seed_claim(marker, "staged-post")
    owner_id, post_id = -60 - marker, 100 + marker
    post = {
        "owner_id": owner_id,
        "id": post_id,
        "from_id": owner_id,
        "text": "zero-comment post",
        "date": 1_700_000_000,
    }
    profiles = {owner_id: {"id": abs(owner_id), "name": "Group"}}
    async with SessionLocal() as session:
        collector = PostCollector(
            adapter=object(),
            repository=SqlAlchemyIngestionRepository(session),
            staging=prepared_stager(session, claim),
            require_staging=True,
        )
        await collector.save_post(
            post,
            SimpleNamespace(task_id=10),
            profiles,
        )
        if reject:
            await session.rollback()
        else:
            await session.commit()
    return await persisted_state(claim, owner_id, post_id)


async def test_zero_comment_post_part_and_local_effects_commit_atomically():
    state = await run_post(6, reject=False)

    assert state == (1, 1, 1, 1, 1)


async def test_post_transaction_rollback_removes_preparation_and_local_effects():
    state = await run_post(7, reject=True)

    assert state == (0, 0, 0, 0, 0)
