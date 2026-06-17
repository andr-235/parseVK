from app.modules.telegram_tgmbase.dependencies import get_tgmbase_service
from app.modules.telegram_tgmbase.schemas import (
    DlImportFileSchema,
    TelegramDlImportContactsPageSchema,
    TelegramDlImportUploadResponseSchema,
    TelegramDlMatchExcludeChatSchema,
    TelegramDlMatchResultMessagesGroupSchema,
    TelegramDlMatchResultSchema,
    TelegramDlMatchRunSchema,
    TgmbaseSearchRequestSchema,
    TgmbaseSearchResponseSchema,
)
from app.modules.telegram_tgmbase.service import TelegramTgmbaseService
from fastapi import APIRouter, BackgroundTasks, Depends, File, Query, Response, UploadFile

router = APIRouter(
    prefix="",
    tags=["telegram-tgmbase"]
)



# РАЗДЕЛ ИМПОРТА

@router.post("/dl-import/upload", response_model=TelegramDlImportUploadResponseSchema)
async def upload_files(
    files: list[UploadFile] = File(...),
    service: TelegramTgmbaseService = Depends(get_tgmbase_service)
) -> TelegramDlImportUploadResponseSchema:
    file_entries = []
    for file in files:
        content = await file.read()
        file_entries.append((content, file.filename))
    
    res = await service.upload_files(file_entries)
    return TelegramDlImportUploadResponseSchema(**res)


@router.get("/dl-import/files", response_model=list[DlImportFileSchema])
async def get_files(
    fileName: str | None = Query(None, alias="fileName"),
    activeOnly: bool | None = Query(None, alias="activeOnly"),
    service: TelegramTgmbaseService = Depends(get_tgmbase_service)
) -> list[DlImportFileSchema]:
    res = await service.get_files(file_name=fileName, active_only=activeOnly)
    return [DlImportFileSchema(**f) for f in res]


@router.get("/dl-import/contacts", response_model=TelegramDlImportContactsPageSchema)
async def get_contacts(
    fileName: str | None = Query(None, alias="fileName"),
    telegramId: str | None = Query(None, alias="telegramId"),
    username: str | None = Query(None, alias="username"),
    phone: str | None = Query(None, alias="phone"),
    activeOnly: bool | None = Query(None, alias="activeOnly"),
    limit: int = Query(100),
    offset: int = Query(0),
    service: TelegramTgmbaseService = Depends(get_tgmbase_service)
) -> TelegramDlImportContactsPageSchema:
    res = await service.get_contacts(
        file_name=fileName,
        telegram_id=telegramId,
        username=username,
        phone=phone,
        active_only=activeOnly,
        limit=limit,
        offset=offset
    )
    return TelegramDlImportContactsPageSchema(**res)


# РАЗДЕЛ СОПОСТАВЛЕНИЙ (DL MATCH)

@router.post("/dl-match/runs", response_model=TelegramDlMatchRunSchema)
async def create_run(
    background_tasks: BackgroundTasks,
    service: TelegramTgmbaseService = Depends(get_tgmbase_service)
) -> TelegramDlMatchRunSchema:
    run = await service.create_run()
    # Запускаем сопоставление в фоновом режиме
    background_tasks.add_task(service.process_run, int(run["id"]))
    return TelegramDlMatchRunSchema(**run)


@router.get("/dl-match/runs", response_model=list[TelegramDlMatchRunSchema])
async def get_runs(
    service: TelegramTgmbaseService = Depends(get_tgmbase_service)
) -> list[TelegramDlMatchRunSchema]:
    runs = await service.get_runs()
    return [TelegramDlMatchRunSchema(**r) for r in runs]


@router.get("/dl-match/runs/{runId}", response_model=TelegramDlMatchRunSchema)
async def get_run_by_id(
    runId: int,
    service: TelegramTgmbaseService = Depends(get_tgmbase_service)
) -> TelegramDlMatchRunSchema:
    run = await service.get_run_by_id(runId)
    return TelegramDlMatchRunSchema(**run)


@router.get("/dl-match/runs/{runId}/results", response_model=list[TelegramDlMatchResultSchema])
async def get_results(
    runId: int,
    strictOnly: str | None = Query(None, alias="strictOnly"),
    usernameOnly: str | None = Query(None, alias="usernameOnly"),
    phoneOnly: str | None = Query(None, alias="phoneOnly"),
    service: TelegramTgmbaseService = Depends(get_tgmbase_service)
) -> list[TelegramDlMatchResultSchema]:
    res = await service.get_results(
        runId,
        strict_only=strictOnly == "true",
        username_only=usernameOnly == "true",
        phone_only=phoneOnly == "true"
    )
    return [TelegramDlMatchResultSchema(**item) for item in res]


@router.get("/dl-match/runs/{runId}/results/{resultId}/messages", response_model=list[TelegramDlMatchResultMessagesGroupSchema])
async def get_result_messages(
    runId: int,
    resultId: int,
    service: TelegramTgmbaseService = Depends(get_tgmbase_service)
) -> list[TelegramDlMatchResultMessagesGroupSchema]:
    res = await service.get_result_messages(runId, resultId)
    return [TelegramDlMatchResultMessagesGroupSchema(**item) for item in res]


@router.post("/dl-match/runs/{runId}/excluded-chats", response_model=TelegramDlMatchRunSchema)
async def exclude_chat(
    runId: int,
    payload: TelegramDlMatchExcludeChatSchema,
    service: TelegramTgmbaseService = Depends(get_tgmbase_service)
) -> TelegramDlMatchRunSchema:
    run = await service.exclude_chat(runId, payload.peerId)
    return TelegramDlMatchRunSchema(**run)


@router.delete("/dl-match/runs/{runId}/excluded-chats/{peerId}", response_model=TelegramDlMatchRunSchema)
async def restore_chat(
    runId: int,
    peerId: str,
    service: TelegramTgmbaseService = Depends(get_tgmbase_service)
) -> TelegramDlMatchRunSchema:
    run = await service.restore_chat(runId, peerId)
    return TelegramDlMatchRunSchema(**run)


@router.get("/dl-match/runs/{runId}/export")
async def export_run(
    runId: int,
    strictOnly: str | None = Query(None, alias="strictOnly"),
    usernameOnly: str | None = Query(None, alias="usernameOnly"),
    phoneOnly: str | None = Query(None, alias="phoneOnly"),
    service: TelegramTgmbaseService = Depends(get_tgmbase_service)
) -> Response:
    buffer, file_name, _ = await service.export_run(
        runId,
        strict_only=strictOnly == "true",
        username_only=usernameOnly == "true",
        phone_only=phoneOnly == "true"
    )
    
    headers = {
        "Content-Disposition": f"attachment; filename={file_name}",
        "Access-Control-Expose-Headers": "Content-Disposition"
    }
    
    return Response(
        content=buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )


# РАЗДЕЛ ПОИСКА ПО БАЗЕ TGMBASE

@router.post("/tgmbase/search", response_model=TgmbaseSearchResponseSchema)
async def search_tgmbase(
    payload: TgmbaseSearchRequestSchema,
    service: TelegramTgmbaseService = Depends(get_tgmbase_service)
) -> TgmbaseSearchResponseSchema:
    res = await service.search_tgmbase(payload.model_dump())
    return TgmbaseSearchResponseSchema(**res)

