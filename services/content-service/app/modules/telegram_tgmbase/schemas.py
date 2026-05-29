from pydantic import BaseModel, Field


# Схемы импорта (уже созданные)

class DlImportBatchSchema(BaseModel):
    id: str
    status: str
    filesTotal: int = Field(..., alias="filesTotal")
    filesSuccess: int = Field(..., alias="filesSuccess")
    filesFailed: int = Field(..., alias="filesFailed")

    class Config:
        populate_by_name = True
        from_attributes = True


class DlImportFileSchema(BaseModel):
    id: str
    originalFileName: str = Field(..., alias="originalFileName")
    status: str
    rowsTotal: int = Field(..., alias="rowsTotal")
    rowsSuccess: int = Field(..., alias="rowsSuccess")
    rowsFailed: int = Field(..., alias="rowsFailed")
    isActive: bool = Field(..., alias="isActive")
    replacedFileId: str | None = Field(None, alias="replacedFileId")
    error: str | None = None

    class Config:
        populate_by_name = True
        from_attributes = True


class TelegramDlImportUploadResponseSchema(BaseModel):
    batch: DlImportBatchSchema
    files: list[DlImportFileSchema]


class TelegramDlImportContactSchema(BaseModel):
    id: str
    importFileId: str | None = Field(None, alias="importFileId")
    originalFileName: str = Field(..., alias="originalFileName")
    isActive: bool = Field(..., alias="isActive")
    telegramId: str | None = Field(None, alias="telegramId")
    username: str | None = None
    phone: str | None = None
    firstName: str | None = Field(None, alias="firstName")
    lastName: str | None = Field(None, alias="lastName")
    description: str | None = None
    region: str | None = None
    joinedAt: str | None = Field(None, alias="joinedAt")
    channelsRaw: str | None = Field(None, alias="channelsRaw")
    fullName: str | None = Field(None, alias="fullName")
    address: str | None = None
    vkUrl: str | None = Field(None, alias="vkUrl")
    email: str | None = None
    telegramContact: str | None = Field(None, alias="telegramContact")
    instagram: str | None = None
    viber: str | None = None
    odnoklassniki: str | None = None
    birthDateText: str | None = Field(None, alias="birthDateText")
    usernameExtra: str | None = Field(None, alias="usernameExtra")
    geo: str | None = None
    sourceRowIndex: int = Field(..., alias="sourceRowIndex")
    createdAt: str = Field(..., alias="createdAt")

    class Config:
        populate_by_name = True
        from_attributes = True


class TelegramDlImportContactsPageSchema(BaseModel):
    items: list[TelegramDlImportContactSchema]
    total: int
    limit: int
    offset: int


# Новые схемы для Telegram-сопоставлений (мэтчинга)

class TelegramDlMatchRunSchema(BaseModel):
    id: str
    status: str
    contactsTotal: int = Field(..., alias="contactsTotal")
    matchesTotal: int = Field(..., alias="matchesTotal")
    strictMatchesTotal: int = Field(..., alias="strictMatchesTotal")
    usernameMatchesTotal: int = Field(..., alias="usernameMatchesTotal")
    phoneMatchesTotal: int = Field(..., alias="phoneMatchesTotal")
    createdAt: str = Field(..., alias="createdAt")
    finishedAt: str | None = Field(None, alias="finishedAt")
    error: str | None = None

    class Config:
        populate_by_name = True
        from_attributes = True


class TelegramDlMatchResultContactSchema(BaseModel):
    id: str
    importFileId: str | None = Field(None, alias="importFileId")
    originalFileName: str | None = Field(None, alias="originalFileName")
    telegramId: str | None = Field(None, alias="telegramId")
    username: str | None = None
    phone: str | None = None
    firstName: str | None = Field(None, alias="firstName")
    lastName: str | None = Field(None, alias="lastName")
    fullName: str | None = Field(None, alias="fullName")
    region: str | None = None
    sourceRowIndex: int | None = Field(None, alias="sourceRowIndex")

    class Config:
        populate_by_name = True


class TelegramDlMatchResultSchema(BaseModel):
    id: str
    runId: str = Field(..., alias="runId")
    dlContactId: str = Field(..., alias="dlContactId")
    tgmbaseUserId: str | None = Field(None, alias="tgmbaseUserId")
    strictTelegramIdMatch: bool = Field(..., alias="strictTelegramIdMatch")
    usernameMatch: bool = Field(..., alias="usernameMatch")
    phoneMatch: bool = Field(..., alias="phoneMatch")
    chatActivityMatch: bool = Field(..., alias="chatActivityMatch")
    dlContact: TelegramDlMatchResultContactSchema = Field(..., alias="dlContact")
    user: dict | None = None
    createdAt: str = Field(..., alias="createdAt")

    class Config:
        populate_by_name = True
        from_attributes = True


class TelegramDlMatchMessageSchema(BaseModel):
    messageId: str = Field(..., alias="messageId")
    messageDate: str | None = Field(None, alias="messageDate")
    text: str | None = None

    class Config:
        populate_by_name = True


class TelegramDlMatchResultMessagesGroupSchema(BaseModel):
    peerId: str = Field(..., alias="peerId")
    chatType: str = Field(..., alias="chatType")
    title: str
    isExcluded: bool = Field(..., alias="isExcluded")
    messages: list[TelegramDlMatchMessageSchema]

    class Config:
        populate_by_name = True


class TelegramDlMatchExcludeChatSchema(BaseModel):
    peerId: str = Field(..., alias="peerId")

    class Config:
        populate_by_name = True

