from typing import Annotated
from fastapi import APIRouter, Depends, File, UploadFile, Query, Request
from app.core.security import require_auth
from app.modules.telegram_tgmbase.schemas import TelegramTgmbaseCapabilitiesResponse
from app.modules.telegram_tgmbase.service import TelegramTgmbaseGatewayService, get_telegram_tgmbase_gateway_service

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
        gatewayManaged=["capabilities", "telegram-dl-import"],
        fallbackManaged=[
            "telegram-auth-session",
            "telegram-sync",
            "telegram-export",
            "telegram-dl-match",
            "tgmbase-search",
            "tgmbase-search-progress",
        ],
        redaction={
            "enabled": True,
            "sensitiveFields": SENSITIVE_TELEGRAM_FIELDS,
        },
    )


@router.post("/telegram/dl-import/upload")
async def upload_files(
    request: Request,
    files: list[UploadFile] = File(...),
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    upload_files = []
    for f in files:
        content = await f.read()
        upload_files.append(("files", (f.filename, content, f.content_type)))
    
    return await service.forward(
        request,
        "POST",
        "/telegram/dl-import/upload",
        files=upload_files,
    )


@router.get("/telegram/dl-import/files")
async def get_files(
    request: Request,
    fileName: str | None = Query(None, alias="fileName"),
    activeOnly: bool | None = Query(None, alias="activeOnly"),
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    params = {}
    if fileName:
        params["fileName"] = fileName
    if activeOnly is not None:
        params["activeOnly"] = str(activeOnly).lower()
        
    return await service.forward(
        request,
        "GET",
        "/telegram/dl-import/files",
        params=params,
    )


@router.get("/telegram/dl-import/contacts")
async def get_contacts(
    request: Request,
    fileName: str | None = Query(None, alias="fileName"),
    telegramId: str | None = Query(None, alias="telegramId"),
    username: str | None = Query(None, alias="username"),
    phone: str | None = Query(None, alias="phone"),
    activeOnly: bool | None = Query(None, alias="activeOnly"),
    limit: int = Query(100),
    offset: int = Query(0),
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    params = {"limit": str(limit), "offset": str(offset)}
    if fileName:
        params["fileName"] = fileName
    if telegramId:
        params["telegramId"] = telegramId
    if username:
        params["username"] = username
    if phone:
        params["phone"] = phone
    if activeOnly is not None:
        params["activeOnly"] = str(activeOnly).lower()
        
    return await service.forward(
        request,
        "GET",
        "/telegram/dl-import/contacts",
        params=params,
    )
