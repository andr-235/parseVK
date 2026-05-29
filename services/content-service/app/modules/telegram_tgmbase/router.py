from fastapi import APIRouter, Depends, File, UploadFile, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_tgmbase_session
from app.modules.telegram_tgmbase.service import TelegramDlImportService
from app.modules.telegram_tgmbase.schemas import (
    TelegramDlImportUploadResponseSchema,
    DlImportFileSchema,
    TelegramDlImportContactsPageSchema
)

router = APIRouter(
    prefix="/telegram/dl-import",
    tags=["telegram-dl-import"]
)


async def get_import_service(session: AsyncSession = Depends(get_tgmbase_session)) -> TelegramDlImportService:
    return TelegramDlImportService(session)


@router.post("/upload", response_model=TelegramDlImportUploadResponseSchema)
async def upload_files(
    files: list[UploadFile] = File(...),
    service: TelegramDlImportService = Depends(get_import_service)
) -> TelegramDlImportUploadResponseSchema:
    file_entries = []
    for file in files:
        content = await file.read()
        file_entries.append((content, file.filename))
    
    res = await service.upload_files(file_entries)
    return TelegramDlImportUploadResponseSchema(**res)


@router.get("/files", response_model=list[DlImportFileSchema])
async def get_files(
    fileName: str | None = Query(None, alias="fileName"),
    activeOnly: bool | None = Query(None, alias="activeOnly"),
    service: TelegramDlImportService = Depends(get_import_service)
) -> list[DlImportFileSchema]:
    res = await service.get_files(file_name=fileName, active_only=activeOnly)
    return [DlImportFileSchema(**f) for f in res]


@router.get("/contacts", response_model=TelegramDlImportContactsPageSchema)
async def get_contacts(
    fileName: str | None = Query(None, alias="fileName"),
    telegramId: str | None = Query(None, alias="telegramId"),
    username: str | None = Query(None, alias="username"),
    phone: str | None = Query(None, alias="phone"),
    activeOnly: bool | None = Query(None, alias="activeOnly"),
    limit: int = Query(100),
    offset: int = Query(0),
    service: TelegramDlImportService = Depends(get_import_service)
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
