<<<<<<< HEAD
from typing import Annotated
from fastapi import APIRouter, Depends, File, UploadFile, Query, Request, Response
from app.core.security import require_auth
from app.modules.telegram_tgmbase.schemas import TelegramTgmbaseCapabilitiesResponse
from app.modules.telegram_tgmbase.service import TelegramTgmbaseGatewayService, get_telegram_tgmbase_gateway_service
=======
from app.core.security import require_auth
from app.modules.telegram_tgmbase.capabilities_router import capabilities_router
from app.modules.telegram_tgmbase.dl_import_router import dl_import_router
from app.modules.telegram_tgmbase.dl_match_router import dl_match_router
from app.modules.telegram_tgmbase.tgmbase_router import tgmbase_router
from fastapi import APIRouter, Depends
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

router = APIRouter(
    prefix="/api/v1/telegram-tgmbase",
    tags=["telegram-tgmbase"],
    dependencies=[Depends(require_auth)],
)

router.include_router(capabilities_router)
router.include_router(dl_import_router)
router.include_router(dl_match_router)
router.include_router(tgmbase_router)
