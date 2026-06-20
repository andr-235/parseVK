from fastapi import APIRouter, Depends

from app.api.content.authors import router as authors_router
from app.api.content.groups import router as groups_router
from app.api.content.posts import router as posts_router
from app.core.security import require_internal_token

router = APIRouter(
    prefix="/internal/content",
    tags=["content"],
    dependencies=[Depends(require_internal_token)],
)
router.include_router(groups_router)
router.include_router(posts_router)
router.include_router(authors_router)
