from datetime import datetime

from pydantic import BaseModel, ConfigDict


class KeywordBase(BaseModel):
    word: str
    category: str | None = None
    is_phrase: bool = False
    enabled: bool = True
    scopes: list[str] = ['moderation', 'im-monitoring']


class KeywordCreate(KeywordBase):
    pass


class KeywordUpdateCategory(BaseModel):
    category: str | None = None


class KeywordResponse(BaseModel):
    id: int
    word: str
    category: str | None
    is_phrase: bool
    enabled: bool = True
    scopes: list[str] = ['moderation', 'im-monitoring']
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BulkAddKeywords(BaseModel):
    words: list[str]


class BulkAddKeywordError(BaseModel):
    word: str
    error: str


class BulkAddStats(BaseModel):
    total: int
    success: int
    failed: int
    created: int
    updated: int


class BulkAddResponse(BaseModel):
    success: list[KeywordResponse]
    failed: list[BulkAddKeywordError]
    stats: BulkAddStats


class KeywordFormDto(BaseModel):
    form: str


class KeywordFormsResponse(BaseModel):
    keyword_id: int
    word: str
    is_phrase: bool
    generated_forms: list[str]
    manual_forms: list[str]
    exclusions: list[str]


class KeywordsListResponse(BaseModel):
    items: list[KeywordResponse]
    total: int
    page: int
    limit: int


class KeywordRecalculationJobResponse(BaseModel):
    id: int
    status: str
    single_keyword_id: int | None = None
    processed: int = 0
    updated: int = 0
    created: int = 0
    deleted: int = 0
    started_at: datetime | None = None
    finished_at: datetime | None = None
    error: str | None = None
    requested_by: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KeywordFormsRebuildResponse(BaseModel):
    keywords_rebuilt: int
    processed: int
    updated: int
    created: int
    deleted: int
