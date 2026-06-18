from app.modules.content.groups_router import groups_router
from app.modules.content.items_router import items_router
from app.modules.content.service import get_content_gateway_service  # noqa: F401
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/content", tags=["content"])
router.include_router(groups_router)
router.include_router(items_router)
