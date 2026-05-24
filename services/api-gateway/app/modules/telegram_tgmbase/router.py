from app.core.security import require_auth
from app.modules.telegram_tgmbase.schemas import TelegramTgmbaseCapabilitiesResponse
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/api/v1/telegram-tgmbase",
    tags=["telegram-tgmbase"],
    dependencies=[Depends(require_auth)],
)

SENSITIVE_TELEGRAM_FIELDS = [
    "apiHash",
    "apiId",
    "authKey",
    "cookie",
    "password",
    "phone",
    "phoneCode",
    "session",
    "sessionString",
    "token",
]


@router.get("/capabilities", response_model=TelegramTgmbaseCapabilitiesResponse)
async def get_capabilities() -> TelegramTgmbaseCapabilitiesResponse:
    return TelegramTgmbaseCapabilitiesResponse(
        domain="telegram-tgmbase",
        migrationStage="inventory",
        gatewayManaged=["capabilities"],
        fallbackManaged=[
            "telegram-auth-session",
            "telegram-sync",
            "telegram-export",
            "telegram-dl-import",
            "telegram-dl-match",
            "tgmbase-search",
            "tgmbase-search-progress",
        ],
        redaction={
            "enabled": True,
            "sensitiveFields": SENSITIVE_TELEGRAM_FIELDS,
        },
    )
