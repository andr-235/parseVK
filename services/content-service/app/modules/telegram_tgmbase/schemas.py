from pydantic import BaseModel, ConfigDict, Field

# Схемы импорта.

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


# Схемы Telegram-сопоставлений.

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


class TelegramDlMatchResultRelatedChatSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    type: str
    peer_id: str
    title: str | None = None


class TelegramDlMatchResultUserSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    user_id: str | None = None
    username: str | None = None
    phone: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    premium: bool | None = None
    scam: bool | None = None
    bot: bool | None = None
    upd_date: str | None = None
    relatedChats: list[TelegramDlMatchResultRelatedChatSchema] = Field(
        default_factory=list,
        alias="relatedChats",
    )


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
    user: TelegramDlMatchResultUserSchema | None = None
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


# Раздел поиска по базе tgmbase (tgmbase-search).

class TgmbaseSearchRequestSchema(BaseModel):
    queries: list[str]
    searchId: str | None = Field(None, alias="searchId")
    page: int | None = 1
    pageSize: int | None = Field(20, alias="pageSize")

    class Config:
        populate_by_name = True


class TgmbaseProfileSchema(BaseModel):
    id: str
    telegramId: str = Field(..., alias="telegramId")
    username: str | None = None
    phoneNumber: str | None = Field(None, alias="phoneNumber")
    firstName: str | None = Field(None, alias="firstName")
    lastName: str | None = Field(None, alias="lastName")
    fullName: str = Field(..., alias="fullName")
    bot: bool
    scam: bool
    premium: bool
    updatedAt: str | None = Field(None, alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True


class TgmbaseCandidateSchema(BaseModel):
    telegramId: str = Field(..., alias="telegramId")
    username: str | None = None
    phoneNumber: str | None = Field(None, alias="phoneNumber")
    fullName: str = Field(..., alias="fullName")

    class Config:
        populate_by_name = True
        from_attributes = True


class TgmbasePeerSchema(BaseModel):
    peerId: str = Field(..., alias="peerId")
    title: str
    username: str | None = None
    type: str
    participantsCount: int | None = Field(None, alias="participantsCount")
    region: int | None = None

    class Config:
        populate_by_name = True
        from_attributes = True


class TgmbaseContactSchema(BaseModel):
    telegramId: str = Field(..., alias="telegramId")
    username: str | None = None
    phoneNumber: str | None = Field(None, alias="phoneNumber")
    fullName: str = Field(..., alias="fullName")
    commonPeersCount: int = Field(..., alias="commonPeersCount")
    messageCount: int = Field(..., alias="messageCount")

    class Config:
        populate_by_name = True


class TgmbaseMessageSchema(BaseModel):
    id: str
    messageId: str = Field(..., alias="messageId")
    peerId: str = Field(..., alias="peerId")
    peerTitle: str | None = Field(None, alias="peerTitle")
    peerType: str = Field(..., alias="peerType")
    date: str
    text: str | None = None
    fromId: str | None = Field(None, alias="fromId")
    replyTo: str | None = Field(None, alias="replyTo")
    hasMedia: bool = Field(..., alias="hasMedia")
    hasKeywords: bool = Field(..., alias="hasKeywords")

    class Config:
        populate_by_name = True


class TgmbaseMessagesPageSchema(BaseModel):
    items: list[TgmbaseMessageSchema]
    page: int
    pageSize: int = Field(..., alias="pageSize")
    total: int
    hasMore: bool = Field(..., alias="hasMore")

    class Config:
        populate_by_name = True


class TgmbaseSearchItemStatsSchema(BaseModel):
    groups: int
    contacts: int
    messages: int


class TgmbaseSearchItemSchema(BaseModel):
    query: str
    normalizedQuery: str = Field(..., alias="normalizedQuery")
    queryType: str = Field(..., alias="queryType")
    status: str
    profile: TgmbaseProfileSchema | None = None
    candidates: list[TgmbaseCandidateSchema] = []
    groups: list[TgmbasePeerSchema] = []
    contacts: list[TgmbaseContactSchema] = []
    messagesPage: TgmbaseMessagesPageSchema = Field(..., alias="messagesPage")
    stats: TgmbaseSearchItemStatsSchema
    error: str | None = None

    class Config:
        populate_by_name = True


class TgmbaseSearchSummarySchema(BaseModel):
    total: int
    found: int
    notFound: int = Field(..., alias="notFound")
    ambiguous: int
    invalid: int
    error: int

    class Config:
        populate_by_name = True


class TgmbaseSearchResponseSchema(BaseModel):
    summary: TgmbaseSearchSummarySchema
    items: list[TgmbaseSearchItemSchema]


