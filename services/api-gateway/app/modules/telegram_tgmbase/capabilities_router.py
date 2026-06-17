from app.modules.telegram_tgmbase.schemas import TelegramTgmbaseCapabilitiesResponse
from fastapi import APIRouter

capabilities_router = APIRouter()

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


@capabilities_router.get("/capabilities", response_model=TelegramTgmbaseCapabilitiesResponse)
async def get_capabilities() -> TelegramTgmbaseCapabilitiesResponse:
    return TelegramTgmbaseCapabilitiesResponse(
        domain="telegram-tgmbase",
        migrationStage="inventory",
        gatewayManaged=[
            "capabilities",
            "telegram-dl-import",
            "telegram-dl-match",
            "tgmbase-search",
            "tgmbase-search-progress",
        ],
        fallbackManaged=[
            "telegram-auth-session",
            "telegram-sync",
            "telegram-export",
        ],
        redaction={
            "enabled": True,
            "sensitiveFields": SENSITIVE_TELEGRAM_FIELDS,
        },
    )
