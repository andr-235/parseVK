from __future__ import annotations

from app.core.security import require_auth
from app.modules.telegram_tgmbase.capabilities_router import capabilities_router
from app.modules.telegram_tgmbase.dl_import_router import dl_import_router
from app.modules.telegram_tgmbase.dl_match_router import dl_match_router
from app.modules.telegram_tgmbase.tgmbase_router import tgmbase_router
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/api/v1/telegram-tgmbase",
    tags=["telegram-tgmbase"],
    dependencies=[Depends(require_auth)],
)

router.include_router(capabilities_router)
router.include_router(dl_import_router)
router.include_router(dl_match_router)
router.include_router(tgmbase_router)
