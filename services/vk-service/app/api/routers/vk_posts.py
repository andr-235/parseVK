from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_vk_client_dep
from app.core.security import require_internal_token
from app.domain.ports.vk_api import VkApiPort

router = APIRouter(
    prefix="/posts",
    tags=["vk"],
    dependencies=[Depends(require_internal_token)],
)


@router.get("/{owner_id}/{post_id}/author-comments")
async def get_author_comments_for_post(
    owner_id: int,
    post_id: int,
    author_vk_id: int = Query(...),
    baseline: datetime | None = Query(default=None),
    batch_size: int = Query(default=100, ge=1, le=100),
    max_pages: int = Query(default=10, ge=1, le=100),
    thread_items_count: int = Query(default=10, ge=0, le=100),
    client: VkApiPort = Depends(get_vk_client_dep),
) -> list[dict]:
    return await client.get_author_comments_for_post(
        owner_id=owner_id,
        post_id=post_id,
        author_vk_id=author_vk_id,
        baseline=baseline,
        batch_size=batch_size,
        max_pages=max_pages,
        thread_items_count=thread_items_count,
    )
