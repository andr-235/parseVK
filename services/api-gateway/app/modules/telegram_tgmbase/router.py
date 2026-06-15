from typing import Annotated
from fastapi import APIRouter, Depends, File, UploadFile, Query, Request, Response
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
        gatewayManaged=[
            "capabilities",
            "telegram-dl-import",
            "telegram-dl-match",
            "tgmbase-search",
            "tgmbase-search-progress"
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


# РАЗДЕЛ СОПОСТАВЛЕНИЙ (DL MATCH)

@router.post("/telegram/dl-match/runs")
async def create_run(
    request: Request,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(
        request,
        "POST",
        "/telegram/dl-match/runs",
    )


@router.get("/telegram/dl-match/runs")
async def get_runs(
    request: Request,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(
        request,
        "GET",
        "/telegram/dl-match/runs",
    )


@router.get("/telegram/dl-match/runs/{runId}")
async def get_run_by_id(
    request: Request,
    runId: int,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(
        request,
        "GET",
        f"/telegram/dl-match/runs/{runId}",
    )


@router.get("/telegram/dl-match/runs/{runId}/results")
async def get_results(
    request: Request,
    runId: int,
    strictOnly: str | None = Query(None, alias="strictOnly"),
    usernameOnly: str | None = Query(None, alias="usernameOnly"),
    phoneOnly: str | None = Query(None, alias="phoneOnly"),
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    params = {}
    if strictOnly:
        params["strictOnly"] = strictOnly
    if usernameOnly:
        params["usernameOnly"] = usernameOnly
    if phoneOnly:
        params["phoneOnly"] = phoneOnly

    return await service.forward(
        request,
        "GET",
        f"/telegram/dl-match/runs/{runId}/results",
        params=params,
    )


@router.get("/telegram/dl-match/runs/{runId}/results/{resultId}/messages")
async def get_result_messages(
    request: Request,
    runId: int,
    resultId: int,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(
        request,
        "GET",
        f"/telegram/dl-match/runs/{runId}/results/{resultId}/messages",
    )


@router.post("/telegram/dl-match/runs/{runId}/excluded-chats")
async def exclude_chat(
    request: Request,
    runId: int,
    payload: dict,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(
        request,
        "POST",
        f"/telegram/dl-match/runs/{runId}/excluded-chats",
        json=payload,
    )


@router.delete("/telegram/dl-match/runs/{runId}/excluded-chats/{peerId}")
async def restore_chat(
    request: Request,
    runId: int,
    peerId: str,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(
        request,
        "DELETE",
        f"/telegram/dl-match/runs/{runId}/excluded-chats/{peerId}",
    )


@router.get("/telegram/dl-match/runs/{runId}/export")
async def export_run(
    request: Request,
    runId: int,
    strictOnly: str | None = Query(None, alias="strictOnly"),
    usernameOnly: str | None = Query(None, alias="usernameOnly"),
    phoneOnly: str | None = Query(None, alias="phoneOnly"),
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    params = {}
    if strictOnly:
        params["strictOnly"] = strictOnly
    if usernameOnly:
        params["usernameOnly"] = usernameOnly
    if phoneOnly:
        params["phoneOnly"] = phoneOnly

    res_raw = await service.forward_raw(
        request,
        "GET",
        f"/telegram/dl-match/runs/{runId}/export",
        params=params,
    )

    # Пересылаем заголовки и контент ответа
    headers = {}
    for key, val in res_raw.headers.items():
        # Не пересылаем служебные заголовки вроде content-length (FastAPI сам их посчитает)
        if key.lower() not in ["content-length", "content-encoding", "transfer-encoding"]:
            headers[key] = val

    return Response(
        content=res_raw.content,
        status_code=res_raw.status_code,
        headers=headers,
        media_type=res_raw.headers.get("content-type"),
    )


# РАЗДЕЛ ПОИСКА ПО БАЗЕ TGMBASE

@router.post("/tgmbase/search")
async def search_tgmbase(
    request: Request,
    payload: dict,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(
        request,
        "POST",
        "/tgmbase/search",
        json=payload,
    )


