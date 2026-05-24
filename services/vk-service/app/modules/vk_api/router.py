from datetime import datetime
from fastapi import APIRouter, Depends, Query

from app.core.config import settings
from app.core.security import require_internal_token
from app.modules.vk_api.client import VkApiClient
from app.modules.vk_api.fake_client import FakeVkApiClient

router = APIRouter(
    prefix="/internal/vk",
    tags=["vk"],
    dependencies=[Depends(require_internal_token)],
)


@router.get("/posts/{owner_id}/{post_id}/author-comments")
async def get_author_comments_for_post(
    owner_id: int,
    post_id: int,
    author_vk_id: int = Query(...),
    baseline: datetime | None = Query(default=None),
    batch_size: int = Query(default=100, ge=1, le=100),
    max_pages: int = Query(default=10, ge=1, le=100),
    thread_items_count: int = Query(default=10, ge=0, le=100),
) -> list[dict]:
    client = FakeVkApiClient() if settings.use_fake_vk_adapter else VkApiClient()
    return await client.get_author_comments_for_post(
        owner_id=owner_id,
        post_id=post_id,
        author_vk_id=author_vk_id,
        baseline=baseline,
        batch_size=batch_size,
        max_pages=max_pages,
        thread_items_count=thread_items_count,
    )
