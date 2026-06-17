from app.modules.telegram_tgmbase.service import (
    TelegramTgmbaseGatewayService,
    get_telegram_tgmbase_gateway_service,
)
from fastapi import APIRouter, Depends, File, Query, Request, UploadFile

dl_import_router = APIRouter()


@dl_import_router.post("/telegram/dl-import/upload")
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


@dl_import_router.get("/telegram/dl-import/files")
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
    return await service.forward(request, "GET", "/telegram/dl-import/files", params=params)


@dl_import_router.get("/telegram/dl-import/contacts")
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
    return await service.forward(request, "GET", "/telegram/dl-import/contacts", params=params)
