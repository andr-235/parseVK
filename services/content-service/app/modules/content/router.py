import logging

from fastapi import APIRouter, Depends

from app.core.security import require_internal_token
from app.modules.content.authors_router import router as authors_router
from app.modules.content.groups_router import router as groups_router
from app.modules.content.posts_router import router as posts_router

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/internal/content",
    tags=["content"],
    dependencies=[Depends(require_internal_token)],
)

logger.info("Initializing content router facade and including sub-routers")

router.include_router(groups_router)
router.include_router(posts_router)
router.include_router(authors_router)
